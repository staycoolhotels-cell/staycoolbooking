import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase-server'; // We might need a service role client here actually
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
        return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
    }

    const supabase = await createServiceRoleClient();

    try {
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                console.log('PaymentIntent Succeeded:', paymentIntent.id);

                const bookingId = paymentIntent.metadata.booking_id;

                if (bookingId) {
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
                            commission_amount: paymentIntent.application_fee_amount,
                            // host_payout_amount is implicit (amount - application_fee_amount)
                        });
                }
                break;
            }

            case 'payment_intent.payment_failed': {
                const failedIntent = event.data.object as Stripe.PaymentIntent;
                console.log('Payment Failed:', failedIntent.id);
                // Handle failure logic (notify user, update booking to failed?)
                break;
            }

            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    } catch (error: any) {
        console.error('Error processing webhook:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
