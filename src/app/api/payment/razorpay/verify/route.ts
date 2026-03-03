import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const {
            orderCreationId,
            razorpayPaymentId,
            razorpayOrderId,
            razorpaySignature,
            bookingId // We need this to update the DB
        } = await req.json();

        const signature = razorpayOrderId + "|" + razorpayPaymentId;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(signature.toString())
            .digest('hex');

        if (expectedSignature !== razorpaySignature) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        // Signature valid, update database
        const supabase = await createClient();

        // 1. Update Booking Status
        const { error: updateError } = await supabase
            .from('bookings')
            .update({ status: 'confirmed' }) // Ensure it's confirmed/paid
            .eq('id', bookingId);

        if (updateError) {
            console.error('Booking update failed:', updateError);
            // Transaction is valid but DB update failed.
        }

        // 2. Record Transaction
        const { data: booking } = await supabase
            .from('bookings')
            .select('guest_id, property_id, total_price')
            .eq('id', bookingId)
            .single();

        if (booking) {
            const totalAmount = Number(booking.total_price);
            let paidAmount = totalAmount;
            if (totalAmount > 100000) {
                paidAmount = totalAmount / 2;
            }

            // Get host_id from property
            const { data: property } = await supabase
                .from('properties')
                .select('host_id')
                .eq('id', booking.property_id)
                .single();

            await supabase
                .from('transactions')
                .insert({
                    booking_id: bookingId,
                    guest_id: booking.guest_id,
                    host_id: property?.host_id,
                    amount: paidAmount, // Record actual paid amount (50% or full)
                    status: 'completed', // or 'succeeded'
                });
        }

        return NextResponse.json({ success: true, message: 'Payment verified' });

    } catch (error: any) {
        console.error('Payment verification failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
