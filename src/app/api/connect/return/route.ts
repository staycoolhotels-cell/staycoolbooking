import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { stripe } from '@/lib/stripe';

export async function GET(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    try {
        // Get user stripe account id
        const { data: userData } = await supabase
            .from('users')
            .select('stripe_account_id')
            .eq('id', user.id)
            .single();

        if (!userData?.stripe_account_id) {
            return NextResponse.redirect(new URL('/host-dashboard?error=no_account', req.url));
        }

        // Retrieve account status from Stripe
        const account = await stripe.accounts.retrieve(userData.stripe_account_id);

        if (account.charges_enabled) {
            await supabase
                .from('users')
                .update({ stripe_onboarding_completed: true })
                .eq('id', user.id);

            return NextResponse.redirect(new URL('/host-dashboard?stripe_connect=success', req.url));
        } else {
            // Not fully onboarded
            return NextResponse.redirect(new URL('/host-dashboard?stripe_connect=incomplete', req.url));
        }

    } catch (error) {
        console.error('Error checking stripe status:', error);
        return NextResponse.redirect(new URL('/host-dashboard?error=stripe_check_failed', req.url));
    }
}
