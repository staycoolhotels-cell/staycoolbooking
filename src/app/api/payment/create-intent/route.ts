import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { stripe } from '@/lib/stripe';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { bookingId } = await req.json();
        console.log('API: Received booking request for:', bookingId);

        if (!bookingId) {
            return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
        }

        const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
        console.log('API: Using Service Role Key?', hasServiceKey);

        if (!hasServiceKey) {
            console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing in environment variables.');
            return NextResponse.json({ error: 'Server Configuration Error: Missing Service Key' }, { status: 500 });
        }

        // Use Service Role to bypass RLS specifically for reading Host's Stripe ID
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Step 1: Fetch Booking
        const { data: booking, error: bookingError } = await supabaseAdmin
            .from('bookings')
            .select('id, total_price, property_id, guest_id')
            .eq('id', bookingId)
            .single();

        if (bookingError || !booking) {
            console.error('Error fetching booking:', bookingError);
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // SECURITY: Ensure only the booking's guest can create a payment intent for it.
        if (booking.guest_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden: this is not your booking' }, { status: 403 });
        }

        // Step 2: Fetch Property
        if (!booking.property_id) {
            console.error('Booking has no property_id:', booking);
            return NextResponse.json({ error: 'Booking is missing property information' }, { status: 400 });
        }

        const { data: property, error: propertyError } = await supabaseAdmin
            .from('properties')
            .select('id, host_id')
            .eq('id', booking.property_id)
            .single();

        if (propertyError || !property) {
            console.error('Error fetching property:', propertyError);
            return NextResponse.json({ error: 'Property not found' }, { status: 404 });
        }

        // Step 3: Fetch Host
        if (!property.host_id) {
            console.error('Property has no host_id:', property);
            return NextResponse.json({ error: 'Property is missing host information' }, { status: 400 });
        }

        const { data: host, error: hostError } = await supabaseAdmin
            .from('users')
            .select('id, stripe_account_id, stripe_onboarding_completed')
            .eq('id', property.host_id)
            .single();

        if (hostError || !host) {
            console.error('Error fetching host:', hostError);
            return NextResponse.json({ error: `Host not found (ID: ${property.host_id})` }, { status: 404 });
        }

        if (!host.stripe_account_id || !host.stripe_onboarding_completed) {
            // For now, fail payment if host is not onboarded.
            // In production, might want 'platform only' payments and manual payout, but requirement is 'automated'.
            return NextResponse.json({ error: 'Host is not ready to receive payments.' }, { status: 400 });
        }

        // --- Referral Commission Logic ---
        const { data: hostProfile } = await supabaseAdmin
            .from('users')
            .select('referral_benefit_count')
            .eq('id', property.host_id)
            .single();

        let commissionRate = 0.20; // Default 20%
        let discountApplied = false;

        if (hostProfile && (hostProfile.referral_benefit_count || 0) > 0) {
            commissionRate = 0.10; // 10% Discount rate
            discountApplied = true;
            console.log(`🎁 Host ${property.host_id} has referral benefit! Using 5% commission (Count: ${hostProfile.referral_benefit_count})`);
            
            // Mark the booking as having applied the discount
            await supabaseAdmin
                .from('bookings')
                .update({ referral_discount_applied: true })
                .eq('id', bookingId);
        }

        const amount = Number(booking.total_price) * 100; // Convert to cents
        const applicationFee = Math.round(amount * commissionRate);

        // Create PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            automatic_payment_methods: { enabled: true },
            application_fee_amount: applicationFee,
            transfer_data: {
                destination: host.stripe_account_id,
            },
            metadata: {
                booking_id: bookingId,
                guest_id: user.id,
                referral_discount_applied: String(discountApplied),
            },
        });

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            id: paymentIntent.id
        });

    } catch (error: any) {
        console.error('Payment Intent Error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
}
