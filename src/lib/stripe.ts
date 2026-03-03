import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY is missing. Stripe functionality will not work.');
}

export const stripe = new Stripe(stripeKey, {
    typescript: true,
});
