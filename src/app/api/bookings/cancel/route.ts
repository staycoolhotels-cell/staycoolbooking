import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';
import { razorpay } from '@/lib/razorpay';
import { differenceInDays, startOfDay } from 'date-fns';
import { getRefundPercentage } from '@/lib/refund-policy';

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

        // 2. Cancellation Timeline Logic Calculation
        const today = startOfDay(new Date());
        const checkInDate = startOfDay(new Date(booking.check_in));
        const daysUntilCheckIn = differenceInDays(checkInDate, today);

        const totalPrice = Number(booking.total_price);
        const guestRefundPercent = getRefundPercentage(booking.check_in, today);
        let adminChargePercent = 0;
        let hostChargePercent = 0;

        if (guestRefundPercent === 100) {
            adminChargePercent = 0;
            hostChargePercent = 0;
        } else if (guestRefundPercent === 70) {
            adminChargePercent = 30;
            hostChargePercent = 0;
        } else if (guestRefundPercent === 30) {
            adminChargePercent = 70;
            hostChargePercent = 0;
        } else {
            // 0% refund
            adminChargePercent = 35;
            hostChargePercent = 65;
        }

        const guestRefundAmount = (totalPrice * guestRefundPercent) / 100;
        const newAdminAmount = (totalPrice * adminChargePercent) / 100;
        const newHostAmount = (totalPrice * hostChargePercent) / 100;

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
                        // Reverse 100% of the host transfer, bringing all money back to the platform
                        await razorpay.transfers.reverse(hostTransfer.id, {
                            amount: originalTransferAmount // reverse full amount in paise
                        });
                    } else if (hostChargePercent === 65 && originalTransferAmount !== Math.round(newHostAmount * 100)) {
                         // We need to reverse the difference if original host transfer was 80% and now they get 65%.
                         // Partial reversal.
                         const diffToReverse = originalTransferAmount - Math.round(newHostAmount * 100);
                         if (diffToReverse > 0) {
                             await razorpay.transfers.reverse(hostTransfer.id, {
                                 amount: diffToReverse // reverse the difference
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
        const { error: updateError } = await adminSupabase
            .from('bookings')
            .update({ 
                status: 'cancelled',
                cancelled_at: new Date().toISOString() 
            })
            .eq('id', bookingId);
            
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
            refundAmount: guestRefundAmount,
            timelineRule: `${daysUntilCheckIn} days before check-in (Guest: ${guestRefundPercent}%, Admin: ${adminChargePercent}%, Host: ${hostChargePercent}%)`
        });

    } catch (error: any) {
        console.error('Cancellation API error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
}
