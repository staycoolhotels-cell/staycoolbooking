import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import crypto from 'crypto';
import { sendTargetedNotification } from '@/lib/activity-actions';

/**
 * POST /api/payment/razorpay/verify
 *
 * Verifies Razorpay payment signature, confirms the booking,
 * and updates the payment_transfers record with all IDs.
 */
export async function POST(req: Request) {
    try {
        const {
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            bookingId,
        } = await req.json();

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !bookingId) {
            return NextResponse.json({ error: 'Missing required payment verification fields.' }, { status: 400 });
        }

        // ─────────────────────────────────────────────
        // 1. Verify HMAC signature
        // ─────────────────────────────────────────────
        const signatureBody = `${razorpayOrderId}|${razorpayPaymentId}`;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(signatureBody)
            .digest('hex');

        if (expectedSignature !== razorpaySignature) {
            return NextResponse.json({ error: 'Invalid payment signature. Payment verification failed.' }, { status: 400 });
        }

        // ─────────────────────────────────────────────
        // 2. Update booking status to confirmed
        // ─────────────────────────────────────────────
        const supabase = await createClient();

        const { error: bookingUpdateError } = await supabase
            .from('bookings')
            .update({
                status: 'confirmed',
                razorpay_payment_id: razorpayPaymentId,
            })
            .eq('id', bookingId);

        if (bookingUpdateError) {
            console.error('Booking update failed:', bookingUpdateError);
            // Payment is valid even if DB update fails — log but don't block response
        }

        // ─────────────────────────────────────────────
        // 3. Update payment_transfers with payment ID
        // ─────────────────────────────────────────────
        const { error: transferUpdateError } = await supabase
            .from('payment_transfers')
            .update({
                razorpay_payment_id: razorpayPaymentId,
                transfer_status: 'processing',
            })
            .eq('razorpay_order_id', razorpayOrderId);

        if (transferUpdateError) {
            console.error('Transfer record update failed:', transferUpdateError);
        }

        // ─────────────────────────────────────────────
        // 4. Financial Record & Referral Logic
        // ─────────────────────────────────────────────
        try {
            // Fetch booking details to get financial and host info
            const { data: booking } = await supabase
                .from('bookings')
                .select('*, property:properties(*)')
                .eq('id', bookingId)
                .single();

            if (booking) {
                const hostId = booking.property?.host_id;
                const amount = Number(booking.total_price);
                // Platform service fee is strictly 100% retained by Admin. It must never be shared with host.
                const guestServiceFee = Number(booking.service_fee) || Math.round((amount * 0.1) / 1.1);
                const hostRevenue = Math.max(0, amount - guestServiceFee);
                const { data: hostProfile } = hostId
                    ? await supabase.from('users').select('referred_by, referral_commissions_remaining').eq('id', hostId).single()
                    : { data: null };
                const commissionRate = hostProfile?.referred_by && (hostProfile.referral_commissions_remaining || 0) > 0 ? 5 : 10;
                const hostPayout = Number((hostRevenue * (1 - commissionRate / 100)).toFixed(2));
                const platformFee = Number((amount - hostPayout).toFixed(2));

                // A. Record Transaction (Secondary Ledger)
                await supabase
                    .from('transactions')
                    .insert({
                        booking_id: bookingId,
                        guest_id: booking.guest_id,
                        host_id: hostId,
                        property_id: booking.property_id,
                        amount: amount,
                        platform_fee: platformFee,
                        host_payout: hostPayout,
                        status: 'completed'
                    });

                // B. Handle Referral Commission Decrement
                if (hostId) {
                    const { data: referralProfile } = await supabase
                        .from('users')
                        .select('referred_by, referral_commissions_remaining')
                        .eq('id', hostId)
                        .single();

                    if (referralProfile && referralProfile.referred_by && (referralProfile.referral_commissions_remaining || 0) > 0) {
                        await supabase
                            .from('users')
                            .update({ referral_commissions_remaining: referralProfile.referral_commissions_remaining - 1 })
                            .eq('id', hostId);
                        console.log(`📉 Decremented referral commissions for host ${hostId}. Remaining: ${referralProfile.referral_commissions_remaining - 1}`);
                    }
                }

                // C. Segregated Browser Notifications (Automated - No Button Click Required)
                const propTitle = booking.property?.title || 'Hotel Stay';
                const bookingRef = `#${bookingId.slice(0, 8).toUpperCase()}`;

                // 1. Guest Side Notification (Only this Guest sees)
                if (booking.guest_id) {
                    await sendTargetedNotification({
                        type: 'booking',
                        title: '🎉 Booking Confirmed!',
                        message: `Your reservation ${bookingRef} for "${propTitle}" is confirmed. Enjoy your stay!`,
                        status: 'success',
                        userId: booking.guest_id,
                        targetRole: 'guest',
                        url: '/user-profile',
                    });
                }

                // 2. Host Side Notification (Only this Host sees)
                if (hostId) {
                    await sendTargetedNotification({
                        type: 'booking',
                        title: '🏨 New Reservation Received!',
                        message: `New booking ${bookingRef} for "${propTitle}". Total: ₹${amount}. Payout scheduled upon check-in.`,
                        status: 'success',
                        userId: hostId,
                        targetRole: 'host',
                        url: '/host-dashboard',
                    });
                }

                // 3. Admin Side Notification (Only Admin sees)
                await sendTargetedNotification({
                    type: 'booking',
                    title: '💼 Booking Payment Captured',
                    message: `Booking ${bookingRef} confirmed: ₹${amount} received. Platform commission: ₹${platformFee}.`,
                    status: 'success',
                    userId: null,
                    targetRole: 'admin',
                    url: '/admin-panel',
                });
            }
        } catch (txnError) {
            // Log but don't fail the verification response if the secondary tasks fail
            console.error('Secondary ledger or referral tasks failed:', txnError);
        }

        return NextResponse.json({
            success: true,
            message: 'Payment verified and booking confirmed.',
            bookingId,
        });

    } catch (error: any) {
        console.error('Payment verification failed:', error);
        return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
}
