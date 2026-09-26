import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';
import { razorpay } from '@/lib/razorpay';
import { stripe } from '@/lib/stripe';

/**
 * POST /api/bookings/check-in
 *
 * Processes guest check-in:
 * 1. Updates booking status to 'checked_in'
 * 2. Triggers the split transfer to the host's Stripe/Razorpay account.
 */
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

        // Use service client to query/write without client RLS limitations
        const supabaseAdmin = createServiceClient();

        // 1. Fetch booking with property host info
        const { data: booking, error: bookingError } = await supabaseAdmin
            .from('bookings')
            .select(`
                *,
                property:properties!property_id (
                    id,
                    host_id
                )
            `)
            .eq('id', bookingId)
            .single();

        if (bookingError || !booking) {
            console.error('[CheckIn] Booking fetch error:', bookingError);
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Security check: only the guest can check in
        if (booking.guest_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden: this is not your booking' }, { status: 403 });
        }

        if (booking.status === 'checked_in') {
            return NextResponse.json({ success: true, message: 'Already checked in.' });
        }

        if (booking.status !== 'confirmed') {
            return NextResponse.json({ error: `Cannot check in. Booking status is: ${booking.status}` }, { status: 400 });
        }

        console.log(`[CheckIn] Processing check-in for booking ${bookingId}`);

        // 2. Perform status update to 'checked_in'
        const { error: updateError } = await supabaseAdmin
            .from('bookings')
            .update({ status: 'checked_in' })
            .eq('id', bookingId);

        if (updateError) {
            console.error('[CheckIn] Failed to update booking status:', updateError);
            return NextResponse.json({ error: 'Failed to update booking status' }, { status: 500 });
        }

        // 3. Process splits
        const hostId = booking.property?.host_id;

        // Check if there is a Razorpay payment
        if (booking.razorpay_payment_id) {
            console.log('[CheckIn] Razorpay payment detected. Transferring split...');

            // Fetch payment transfer details
            const { data: transferDetails, error: transferDetailsError } = await supabaseAdmin
                .from('payment_transfers')
                .select('*')
                .eq('booking_id', bookingId)
                .single();

            if (transferDetailsError || !transferDetails) {
                console.error('[CheckIn] Razorpay transfer details not found:', transferDetailsError);
                return NextResponse.json({ 
                    success: true, 
                    message: 'Checked in successfully, but host transfer details were not found.' 
                });
            }

            if (transferDetails.transfer_status === 'settled') {
                console.log('[CheckIn] Razorpay split already settled.');
                return NextResponse.json({ success: true, message: 'Checked in successfully. Payout was already split.' });
            }

            // Fetch host linked account ID
            const { data: hostKyc } = await supabaseAdmin
                .from('host_kyc_details')
                .select('razorpay_account_id, kyc_status')
                .eq('user_id', hostId)
                .single();

            const hostRazorpayAccountId = (hostKyc?.kyc_status === 'activated') ? hostKyc.razorpay_account_id : null;

            // Fetch referrer linked account ID (if applicable)
            let referrerRazorpayAccountId = null;
            if (transferDetails.referrer_id && transferDetails.referrer_amount > 0) {
                const { data: referrerKyc } = await supabaseAdmin
                    .from('host_kyc_details')
                    .select('razorpay_account_id, kyc_status')
                    .eq('user_id', transferDetails.referrer_id)
                    .single();
                if (referrerKyc?.kyc_status === 'activated') {
                    referrerRazorpayAccountId = referrerKyc.razorpay_account_id;
                }
            }

            const transfers = [];

            // Add Host payout
            if (hostRazorpayAccountId && Number(transferDetails.host_amount) > 0) {
                transfers.push({
                    account: hostRazorpayAccountId,
                    amount: Math.round(Number(transferDetails.host_amount) * 100), // paise
                    currency: 'INR',
                    notes: {
                        booking_id: bookingId,
                        type: 'host_payout',
                        host_id: hostId,
                    }
                });
            }

            // Add Referrer split
            if (referrerRazorpayAccountId && Number(transferDetails.referrer_amount) > 0) {
                transfers.push({
                    account: referrerRazorpayAccountId,
                    amount: Math.round(Number(transferDetails.referrer_amount) * 100), // paise
                    currency: 'INR',
                    notes: {
                        booking_id: bookingId,
                        type: 'referral_commission',
                        referred_host_id: hostId,
                        referrer_id: transferDetails.referrer_id
                    }
                });
            }

            let holdReleased = false;
            if (transferDetails.razorpay_transfer_id) {
                try {
                    console.log(`[CheckIn] Releasing Razorpay hold on transfer ${transferDetails.razorpay_transfer_id}...`);
                    await razorpay.transfers.edit(transferDetails.razorpay_transfer_id, { on_hold: 0 });
                    holdReleased = true;
                    await supabaseAdmin
                        .from('payment_transfers')
                        .update({
                            transfer_status: 'settled',
                        })
                        .eq('booking_id', bookingId);
                    console.log('[CheckIn] Razorpay hold released successfully.');
                } catch (holdErr: any) {
                    console.warn('[CheckIn] Failed to release hold directly, will attempt fallback transfer:', holdErr);
                }
            }

            if (!holdReleased) {
                if (transfers.length > 0) {
                    try {
                        const transferResult = await razorpay.payments.transfer(booking.razorpay_payment_id, { transfers });
                        console.log('[CheckIn] Razorpay transfer response:', transferResult);

                        const returnedItems = transferResult.items || [];
                        const hostTransferId = returnedItems.find((item: any) => item.notes?.type === 'host_payout')?.id || (transferResult as any).id;

                        await supabaseAdmin
                            .from('payment_transfers')
                            .update({
                                razorpay_transfer_id: hostTransferId,
                                transfer_status: 'settled',
                            })
                            .eq('booking_id', bookingId);

                        console.log('[CheckIn] Razorpay payout transfers completed successfully.');
                    } catch (rpError: any) {
                        console.error('[CheckIn] Razorpay transfer request failed:', rpError);
                        await supabaseAdmin
                            .from('payment_transfers')
                            .update({
                                transfer_status: 'failed',
                                failure_reason: rpError.message || 'Razorpay transfer failed',
                            })
                            .eq('booking_id', bookingId);
                    }
                } else {
                    console.warn('[CheckIn] No active host/referrer linked accounts found. Split remains with Admin.');
                    await supabaseAdmin
                        .from('payment_transfers')
                        .update({
                            transfer_status: 'failed',
                            failure_reason: 'No activated host or referrer KYC accounts found to transfer funds.',
                        })
                        .eq('booking_id', bookingId);
                }
            }
        } 
        
        // Check if there is a Stripe payment
        else {
            // Find in payments table
            const { data: stripePayment, error: paymentError } = await supabaseAdmin
                .from('payments')
                .select('*')
                .eq('booking_id', bookingId)
                .eq('status', 'succeeded')
                .single();

            if (paymentError || !stripePayment) {
                console.log('[CheckIn] Stripe payment not found or failed in payments table:', paymentError);
            } else {
                console.log('[CheckIn] Stripe payment detected. Transferring split...');

                // Fetch host's stripe account id
                const { data: hostUser } = await supabaseAdmin
                    .from('users')
                    .select('stripe_account_id, stripe_onboarding_completed')
                    .eq('id', hostId)
                    .single();

                if (hostUser?.stripe_account_id && hostUser.stripe_onboarding_completed) {
                    const commissionAmount = Number(stripePayment.commission_amount || 0);
                    const totalPaid = Number(stripePayment.amount); // already in cents
                    const hostAmount = totalPaid - commissionAmount;

                    if (hostAmount > 0) {
                        try {
                            const transfer = await stripe.transfers.create({
                                amount: Math.round(hostAmount),
                                currency: stripePayment.currency || 'usd',
                                destination: hostUser.stripe_account_id,
                                transfer_group: bookingId,
                            });
                            console.log('[CheckIn] Stripe transfer completed:', transfer.id);
                            
                            // Update payments table with transfer details
                            await supabaseAdmin
                                .from('payments')
                                .update({
                                    status: 'transferred', // mark as transferred to host
                                })
                                .eq('id', stripePayment.id);

                        } catch (stripeError: any) {
                            console.error('[CheckIn] Stripe transfer failed:', stripeError);
                        }
                    }
                } else {
                    console.warn('[CheckIn] Host Stripe onboarding not completed. Split remains with Admin.');
                }
            }
        }

        return NextResponse.json({ success: true, message: 'Checked in and payouts processed.' });

    } catch (error: any) {
        console.error('[CheckIn] Error processing check-in:', error);
        return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
}
