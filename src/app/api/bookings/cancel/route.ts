import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';
import { razorpay } from '@/lib/razorpay';
import { differenceInDays, startOfDay } from 'date-fns';
import { calculateRefundDistribution } from '@/lib/refund-policy';

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

        // 2. Cancellation Distribution Logic Calculation
        const transfer = booking.payment_transfer && booking.payment_transfer.length > 0 ? booking.payment_transfer[0] : null;
        const commissionRate = transfer?.commission_value ? Number(transfer.commission_value) : 10;

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
            Number(booking.free_cancellation_fee || 0),
            commissionRate
        );

        // 3. Initiate Razorpay Refunds / Reversals
        const rzpPaymentId = booking.razorpay_payment_id;
        
        // If a payment exists on razorpay
        if (rzpPaymentId) {
            try {
                // To do exact logic, we should reverse the original transfers exactly how we need.
                // Fetch existing transfers for this payment
                const transfersList = await razorpay.payments.fetchTransfer(rzpPaymentId);

                // If host transfer exists
                if (transfersList && transfersList.items && transfersList.items.length > 0) {
                    const hostTransfer = transfersList.items[0] as any; // Assuming only 1 transfer to host exists per payment
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

                // Now execute the Refund to Guest (from Platform)
                if (guestRefundAmount > 0) {
                    await razorpay.payments.refund(rzpPaymentId, {
                        amount: Math.round(guestRefundAmount * 100), // in paise
                        notes: {
                            reason: 'User cancelled booking based on policy',
                            booking_id: bookingId,
                            days_until_check_in: String(daysUntilCheckIn)
                        }
                    });
                }
            } catch (paymentErr: any) {
                console.error("Razorpay Cancellation Failed:", paymentErr);
                return NextResponse.json({ error: 'Failed to process refund with Payment Gateway.' }, { status: 500 });
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
