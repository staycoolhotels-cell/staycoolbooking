import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import crypto from 'crypto';

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

        return NextResponse.json({
            success: true,
            message: 'Payment verified and booking confirmed.',
            bookingId,
        });

    } catch (error: any) {
        console.error('Payment verification failed:', error);
        return NextResponse.json({ error: error.message || 'Payment verification error' }, { status: 500 });
    }
}
