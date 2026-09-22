import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';
import { razorpay } from '@/lib/razorpay';
import { differenceInDays, startOfDay } from 'date-fns';
import { calculateRefundDistribution } from '@/lib/refund-policy';
import { sendTargetedNotification } from '@/lib/activity-actions';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { bookingId } = await req.json();

        if (!bookingId) {
            return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
        }

        // 1. Fetch Booking and Payment Transfer records
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select(`
                *,
                has_free_cancellation,
                free_cancellation_fee,
                property:properties!property_id (
                    id, title, host_id
                ),
                payment_transfer:payment_transfers!booking_id (*)
            `)
            .eq('id', bookingId)
            .single();

        if (bookingError || !booking) {
            console.error('Booking fetch error:', bookingError);
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        if (booking.guest_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden: this is not your booking' }, { status: 403 });
        }

        if (booking.status === 'cancelled') {
            return NextResponse.json({ error: 'Booking is already cancelled' }, { status: 400 });
        }

        const now = new Date();
        const totalPrice = Number(booking.total_price);
        const daysUntilCheckIn = differenceInDays(startOfDay(new Date(booking.check_in)), startOfDay(now));

        // 2. Cancellation Distribution Logic Calculation (10% platform fee on cancellation)
        const commissionRate = 10;


        const { 
            guestRefundAmount, 
            hostShare: newHostAmount, 
            adminShare: newAdminAmount,
            hostSharePercent: hostChargePercent,
            guestRefundPercent
        } = calculateRefundDistribution(
            totalPrice,
            booking.check_in,
            now,
            booking.created_at,
            booking.has_free_cancellation,
            Number(booking.free_cancellation_fee || 0)
        );

        // 3. Initiate Razorpay Refunds / Reversals
        const rzpPaymentId = booking.razorpay_payment_id;
        
        // If a payment exists on razorpay
        if (rzpPaymentId) {
            // A. Safely attempt transfer reversals if host was already paid
            try {
                const transfersList = await razorpay.payments.fetchTransfer(rzpPaymentId);

                if (transfersList && transfersList.items && transfersList.items.length > 0) {
                    const hostTransfer = transfersList.items[0] as any;
                    const originalTransferAmount = Number(hostTransfer.amount);
                    
                    if (hostChargePercent === 0) {
                        // Reverse 100% of the host transfer
                        await razorpay.transfers.reverse(hostTransfer.id, {
                            amount: originalTransferAmount
                        });
                    } else {
                        // Reverse the difference if host gets less than original
                        const expectedHostAmountPaise = Math.round(newHostAmount * 100);
                        const diffToReverse = originalTransferAmount - expectedHostAmountPaise;
                        if (diffToReverse > 0) {
                            await razorpay.transfers.reverse(hostTransfer.id, {
                                amount: diffToReverse
                            });
                        }
                    }
                }
            } catch (transferErr: any) {
                // Non-fatal: if no transfers were created yet or transfer fetch fails, continue with guest refund
                console.warn("Transfer reversal skipped or not applicable:", transferErr?.message || transferErr);
            }

            // B. Execute the Refund to Guest via Razorpay
            try {
                if (guestRefundAmount > 0) {
                    const refundResult = await razorpay.payments.refund(rzpPaymentId, {
                        amount: Math.round(guestRefundAmount * 100), // in paise
                        notes: {
                            reason: 'User cancelled booking based on policy',
                            booking_id: bookingId,
                            days_until_check_in: String(daysUntilCheckIn)
                        }
                    });
                    console.log("Razorpay Refund Success:", refundResult);
                }
            } catch (paymentErr: any) {
                console.error("Razorpay Cancellation Failed:", paymentErr);
                return NextResponse.json({ 
                    error: `Payment Gateway Refund Failed: ${paymentErr?.error?.description || paymentErr?.message || 'Unknown error'}` 
                }, { status: 500 });
            }
        }

        // 4. Update Database records
        // IMPORTANT: Use serviceRoleClient to ensure status update succeeds bypassing RLS 
        // after we have already verified ownership above.
        const adminSupabase = await createServiceClient();

        // Update booking status
        // Attempt with cancelled_at, fallback if column missing
        const updatePayload: any = { status: 'cancelled' };
        
        // Try to update with cancelled_at first
        const { error: initialUpdateError } = await adminSupabase
            .from('bookings')
            .update({ 
                ...updatePayload,
                cancelled_at: new Date().toISOString() 
            })
            .eq('id', bookingId);
            
        let updateError = initialUpdateError;

        // If the error is about missing column, retry without it
        if (updateError && updateError.message && updateError.message.includes('cancelled_at')) {
            console.warn('cancelled_at column missing, retrying without it');
            const { error: retryError } = await adminSupabase
                .from('bookings')
                .update(updatePayload)
                .eq('id', bookingId);
            updateError = retryError;
        }
            
        if (updateError) {
            console.error('Booking status update error:', updateError);
            throw new Error('Failed to update booking status in database');
        }
            
        // Update payment_transfers if it exists
        if (booking.payment_transfer && booking.payment_transfer.length > 0) {
            const transferRecord = booking.payment_transfer[0];
            const { error: transferError } = await adminSupabase
                .from('payment_transfers')
                .update({
                    platform_commission: newAdminAmount,
                    host_amount: newHostAmount,
                    transfer_status: guestRefundPercent === 100 ? 'reversed' : 'partial_reversal'
                })
                .eq('id', transferRecord.id);
            
            if (transferError) {
                console.error('Transfer record update error:', transferError);
                // Non-critical: the booking itself is cancelled, but transfer record remains stale.
            }
        }

        // 5. Automated Segregated Browser Notifications (No manual button click needed)
        try {
            const propTitle = booking.property?.title || 'Hotel Stay';
            const bookingRef = `#${bookingId.slice(0, 8).toUpperCase()}`;

            // A. Guest Notification (Only the cancelling guest sees this)
            await sendTargetedNotification({
                type: 'booking',
                title: '❌ Booking Cancelled',
                message: `Your booking ${bookingRef} for "${propTitle}" has been cancelled. Expected refund: ₹${guestRefundAmount}.`,
                status: 'warning',
                userId: booking.guest_id,
                targetRole: 'guest',
                url: '/user-profile',
            });

            // B. Host Notification (Only the host of this property sees this)
            if (booking.property?.host_id) {
                await sendTargetedNotification({
                    type: 'booking',
                    title: '⚠️ Reservation Cancelled',
                    message: `Reservation ${bookingRef} for "${propTitle}" was cancelled by guest. Your compensation: ₹${newHostAmount}.`,
                    status: 'warning',
                    userId: booking.property.host_id,
                    targetRole: 'host',
                    url: '/host-dashboard',
                });
            }

            // C. Admin Notification (Only Admin sees this)
            await sendTargetedNotification({
                type: 'booking',
                title: '🔄 Booking Cancellation & Refund',
                message: `Booking ${bookingRef} cancelled. Refund to guest: ₹${guestRefundAmount}, Admin retained: ₹${newAdminAmount}.`,
                status: 'info',
                userId: null,
                targetRole: 'admin',
                url: '/admin-panel',
            });
        } catch (notifErr) {
            console.error('Cancellation notification error (non-fatal):', notifErr);
        }

        return NextResponse.json({
            success: true,
            message: 'Booking cancelled successfully',
            refundAmount: guestRefundAmount
        });

    } catch (error: any) {
        console.error('Cancellation API error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
}
