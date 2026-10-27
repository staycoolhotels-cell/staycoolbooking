import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';
import { razorpay } from '@/lib/razorpay';

/**
 * POST /api/payment/razorpay/create-order
 *
 * Creates a Razorpay order with automatic payment split via Route.
 * Keeps a fixed 10% platform commission and pays the remaining 90% to the host.
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

        // ─────────────────────────────────────────────
        // 1. Fetch Booking with property info
        // ─────────────────────────────────────────────
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select(`
                id,
                total_price,
                status,
                guest_id,
                property_id,
                service_fee,
                razorpay_payment_id,
                property:properties!property_id (
                    id,
                    host_id
                )
            `)
            .eq('id', bookingId)
            .single();

        if (bookingError || !booking) {
            console.error('Booking fetch error:', bookingError);
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Ensure access: only the guest can pay for their own booking
        if (booking.guest_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden: this is not your booking' }, { status: 403 });
        }

        if (booking.razorpay_payment_id) {
            return NextResponse.json({ error: 'This booking is already paid.' }, { status: 409 });
        }

        const totalAmount = Number(booking.total_price);
        const property = booking.property as any;
        const hostId = property?.host_id;

        const serviceClient = createServiceClient();

        // ─────────────────────────────────────────────
        // 2. Referred hosts receive a 5% platform commission for their first
        // referral bookings (the remaining allowance is consumed per booking).
        // The referring host also receives a 5% referral commission on each
        // of those bookings, and the rest stays with the platform.
        // ─────────────────────────────────────────────
        const { data: hostProfile } = hostId
            ? await serviceClient.from('users').select('referred_by, referral_commissions_remaining').eq('id', hostId).single()
            : { data: null };
        const referralActive = Boolean(hostProfile?.referred_by && (hostProfile?.referral_commissions_remaining || 0) > 0);
        const commissionValue = referralActive ? 5 : 10;
        // Zero commission from guest. Commission is deducted solely from Host payout.
        const guestServiceFee = 0;
        const hostGross = totalAmount; // Full amount paid by guest
        const hostCommission = Number((hostGross * (commissionValue / 100)).toFixed(2));
        const hostAmount = Number((hostGross - hostCommission).toFixed(2));
        const referrerCommission = referralActive ? Number((hostGross * 0.05).toFixed(2)) : 0;
        const referrerId = referralActive ? (hostProfile?.referred_by || null) : null;
        const adminCommission = Number((totalAmount - hostAmount - referrerCommission).toFixed(2));
        const commissionType = 'percentage';

        // ─────────────────────────────────────────────
        // 3. Fetch host's and referrer's linked accounts (bypassing RLS with serviceClient)
        // ─────────────────────────────────────────────
        let hostRazorpayAccountId: string | null = null;
        let referrerRazorpayAccountId: string | null = null;

        if (hostId) {
            const { data: hostKyc, error: hostKycError } = await serviceClient
                .from('host_kyc_details')
                .select('razorpay_account_id, kyc_status')
                .eq('user_id', hostId)
                .single();

            if (hostKycError) {
                console.error('[CreateOrder] Error fetching host KYC:', hostKycError);
            }

            if (hostKyc?.razorpay_account_id && hostKyc.kyc_status === 'activated') {
                hostRazorpayAccountId = hostKyc.razorpay_account_id;
            }
        }

        if (referrerId && referrerCommission > 0) {
            const { data: referrerKyc, error: referrerKycError } = await serviceClient
                .from('host_kyc_details')
                .select('razorpay_account_id, kyc_status')
                .eq('user_id', referrerId)
                .single();

            if (referrerKycError) {
                console.error('[CreateOrder] Error fetching referrer KYC:', referrerKycError);
            }

            if (referrerKyc?.razorpay_account_id && referrerKyc.kyc_status === 'activated') {
                referrerRazorpayAccountId = referrerKyc.razorpay_account_id;
            } else {
                console.warn(`Referrer ${referrerId} has no active Razorpay account. Split will stay with Admin.`);
            }
        }

        // If host has no active linked account, allow the booking but hold the full
        // amount with the platform. Admin will manually transfer once host activates.
        if (!hostRazorpayAccountId && hostAmount > 0) {
            console.warn(
                `[CreateOrder] Host ${hostId} has no active Razorpay Route account. ` +
                `Full payment (₹${totalAmount}) will be held by platform. Manual payout needed after host activates.`
            );
        }

        // ─────────────────────────────────────────────
        // 4. Build Razorpay order with Route transfers
        // ─────────────────────────────────────────────
        const amountInPaise = Math.round(totalAmount * 100);

        const transfers = [];
        
        // Host Payout (placed ON HOLD in Razorpay Route escrow until guest checks in)
        if (hostRazorpayAccountId && hostAmount > 0) {
            transfers.push({
                account: hostRazorpayAccountId,
                amount: Math.round(hostAmount * 100), // paise
                currency: 'INR',
                notes: {
                    booking_id: bookingId,
                    type: 'host_payout',
                    host_id: hostId,
                },
                linked_account_notes: ['booking_id'],
                on_hold: 1, // Held securely in Razorpay escrow; never sweeps to Admin bank
            });
        }

        // Referrer Commission Split (also ON HOLD until check-in)
        if (referrerRazorpayAccountId && referrerCommission > 0) {
            transfers.push({
                account: referrerRazorpayAccountId,
                amount: Math.round(referrerCommission * 100), // paise
                currency: 'INR',
                notes: {
                    booking_id: bookingId,
                    type: 'referral_commission',
                    referred_host_id: hostId,
                    referrer_id: referrerId
                },
                linked_account_notes: ['booking_id'],
                on_hold: 1,
            });
        }

        const orderOptions: any = {
            amount: amountInPaise.toString(),
            currency: 'INR',
            receipt: `booking_${bookingId.slice(0, 20)}`,
            notes: {
                booking_id: bookingId,
                guest_id: user.id,
                property_id: booking.property_id,
                admin_commission: adminCommission.toFixed(2),
                referrer_commission: referrerCommission.toFixed(2),
                host_amount: hostAmount.toFixed(2),
            },
        };

        // Attach transfers with on_hold: 1 so Razorpay Route places the host payout
        // in escrow on hold. This guarantees Razorpay will NEVER auto-settle the host's
        // money into the Admin's bank account before check-in.
        if (transfers.length > 0) {
            orderOptions.transfers = transfers;
        }

        const order = await razorpay.orders.create(orderOptions);

        // ─────────────────────────────────────────────
        // 5. Persist order ID on booking (using serviceClient)
        // ─────────────────────────────────────────────
        await serviceClient
            .from('bookings')
            .update({ razorpay_order_id: order.id })
            .eq('id', bookingId);

        // ─────────────────────────────────────────────
        // 6. Create pending payment_transfers record (use serviceClient to bypass RLS)
        // ─────────────────────────────────────────────
        await serviceClient
            .from('payment_transfers')
            .upsert(
                {
                    booking_id: bookingId,
                    host_id: hostId,
                    razorpay_order_id: order.id,
                    razorpay_transfer_id: null,
                    total_amount: totalAmount,
                    platform_commission: adminCommission,
                    host_amount: hostAmount,
                    commission_type: commissionType,
                    commission_value: commissionValue,
                    // If host has no active account, mark as deferred — will be processed
                    // automatically once host activates their Razorpay linked account.
                    transfer_status: hostRazorpayAccountId ? 'pending' : 'pending_host_activation',
                    referrer_id: referrerId,
                    referrer_amount: referrerCommission,
                },
                { onConflict: 'booking_id' }
            );

        return NextResponse.json({
            orderId: order.id,
            amount: amountInPaise,
            currency: 'INR',
            keyId: process.env.RAZORPAY_KEY_ID,
            breakdown: {
                total: totalAmount,
                adminCommission: adminCommission,
                referrerCommission: referrerCommission,
                hostAmount: hostAmount,
                commissionType,
                commissionValue,
                splitEnabled: !!hostRazorpayAccountId,
            },
        });

    } catch (error: any) {
        console.error('Razorpay order creation failed:', error);
        return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
}
