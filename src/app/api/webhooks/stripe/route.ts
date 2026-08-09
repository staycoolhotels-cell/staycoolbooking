import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

// We need a service role client because webhooks are public (verified by signature) but need to write to DB
import { createServerClient } from '@supabase/ssr'; // Can't use existing helper which relies on cookies

const createServiceRoleClient = async () => {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll() { return [] },
                setAll() { }
            }
        }
    );
};


export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        console.error('Webhook signature verification failed.', error.message);
        return NextResponse.json({ error: 'Webhook Error: An unexpected error occurred.' }, { status: 400 });
    }

    const supabase = await createServiceRoleClient();

    try {
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                console.info('PaymentIntent Succeeded:', paymentIntent.id);

                const bookingId = paymentIntent.metadata.booking_id;

                if (bookingId) {
                    // Fetch booking's service_fee
                    const { data: booking } = await supabase
                        .from('bookings')
                        .select('service_fee')
                        .eq('id', bookingId)
                        .single();

                    const guestServiceFeeInCents = booking?.service_fee
                        ? Math.round(Number(booking.service_fee) * 100)
                        : Math.round(paymentIntent.amount * 0.1 / 1.1);
                    const hostRevenueInCents = Math.max(0, paymentIntent.amount - guestServiceFeeInCents);
                    const hostPayoutInCents = Math.round(hostRevenueInCents * 0.90);
                    const platformCommissionInCents = paymentIntent.amount - hostPayoutInCents;

                    // Update booking status
                    await supabase
                        .from('bookings')
                        .update({ status: 'confirmed' }) // or 'paid'
                        .eq('id', bookingId);

                    // Record payment
                    await supabase
                        .from('payments')
                        .insert({
                            booking_id: bookingId,
                            amount: paymentIntent.amount,
                            currency: paymentIntent.currency,
                            status: 'succeeded',
                            stripe_payment_intent_id: paymentIntent.id,
                            commission_amount: platformCommissionInCents,
                        });

                    // --- Referral Benefit Decrement ---
                    const discountApplied = paymentIntent.metadata.referral_discount_applied === 'true';
                    if (discountApplied) {
                        console.info('🎁 Referral discount was applied. Decrementing host benefit count.');
                        // Fetch property to find host_id
                        const { data: bookingData } = await supabase
                            .from('bookings')
                            .select('property_id, properties(host_id)')
                            .eq('id', bookingId)
                            .single();
                        
                        const hostId = (bookingData?.properties as any)?.host_id;
                        if (hostId) {
                            console.info(`📉 Decrementing benefit for host: ${hostId}`);
                            await supabase.rpc('decrement_referral_benefit', { p_host_id: hostId });
                        }
                    }
                }
                break;
            }

            case 'payment_intent.payment_failed': {
                const failedIntent = event.data.object as Stripe.PaymentIntent;
                console.warn('Payment Failed:', failedIntent.id);
                // Handle failure logic (notify user, update booking to failed?)
                break;
            }

            default:
                console.info(`Unhandled event type ${event.type}`);
        }
    } catch (error: any) {
        console.error('Error processing webhook:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
