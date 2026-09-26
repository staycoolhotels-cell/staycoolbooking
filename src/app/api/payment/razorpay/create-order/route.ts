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

        // ─────────────────────────────────────────────
        // 2. Referred hosts receive a 5% platform commission for their first
        // referral bookings (the remaining allowance is consumed per booking).
        // The referring host also receives a 5% referral commission on each
        // of those bookings, and the rest stays with the platform.
        // ─────────────────────────────────────────────
        const { data: hostProfile } = hostId
            ? await supabase.from('users').select('referred_by, referral_commissions_remaining').eq('id', hostId).single()
            : { data: null };
        const referralActive = Boolean(hostProfile?.referred_by && (hostProfile?.referral_commissions_remaining || 0) > 0);
        const commissionValue = referralActive ? 5 : 10;
        // Platform service fee is strictly 100% retained by Admin. It must never be shared with host.
        const guestServiceFee = Number(booking.service_fee) || Math.round((totalAmount * 0.1) / 1.1);
        const hostRevenue = Math.max(0, totalAmount - guestServiceFee);
        const hostCommission = Number((hostRevenue * (commissionValue / 100)).toFixed(2));
        const hostAmount = Number((hostRevenue - hostCommission).toFixed(2));
        const referrerCommission = referralActive ? Number((hostRevenue * 0.05).toFixed(2)) : 0;
        const referrerId = referralActive ? (hostProfile?.referred_by || null) : null;
        const adminCommission = Number((totalAmount - hostAmount - referrerCommission).toFixed(2));
        const commissionType = 'percentage';

        // ─────────────────────────────────────────────
        // 3. Fetch host's and referrer's linked accounts
        // ─────────────────────────────────────────────
        let hostRazorpayAccountId: string | null = null;
        let referrerRazorpayAccountId: string | null = null;

        if (hostId) {
            const { data: hostKyc } = await supabase
                .from('host_kyc_details')
                .select('razorpay_account_id, kyc_status')
                .eq('user_id', hostId)
                .single();

            if (hostKyc?.razorpay_account_id && hostKyc.kyc_status === 'activated') {
                hostRazorpayAccountId = hostKyc.razorpay_account_id;
            }
        }

        if (referrerId && referrerCommission > 0) {
            const { data: referrerKyc } = await supabase
                .from('host_kyc_details')
                .select('razorpay_account_id, kyc_status')
                .eq('user_id', referrerId)
                .single();

            if (referrerKyc?.razorpay_account_id && referrerKyc.kyc_status === 'activated') {
                referrerRazorpayAccountId = referrerKyc.razorpay_account_id;
            } else {
                console.warn(`Referrer ${referrerId} has no active Razorpay account. Split will stay with Admin.`);
            }
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

        // Attach Route transfers with on_hold: 1 so host share remains held in Razorpay
        // and does NOT sweep to the Admin bank account.
        if (transfers.length > 0) {
            orderOptions.transfers = transfers;
        }

        const order = await razorpay.orders.create(orderOptions);

        // ─────────────────────────────────────────────
        // 5. Persist order ID on booking (use serviceClient to bypass RLS)
        // ─────────────────────────────────────────────
        const serviceClient = createServiceClient();

        await serviceClient
            .from('bookings')
            .update({ razorpay_order_id: order.id })
            .eq('id', bookingId);

        // Extract host transfer ID from order transfers if created
        const rawTransfers: any[] = Array.isArray((order as any).transfers)
            ? (order as any).transfers
            : (order as any).transfers?.items || [];
        const hostTransfer = rawTransfers.find((t: any) => t.notes?.type === 'host_payout') || rawTransfers[0];

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
                    razorpay_transfer_id: hostTransfer?.id || null,
                    total_amount: totalAmount,
                    platform_commission: adminCommission,
                    host_amount: hostAmount,
                    commission_type: commissionType,
                    commission_value: commissionValue,
                    transfer_status: 'pending',
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
                splitEnabled: transfers.length > 0,
            },
        });

    } catch (error: any) {
        console.error('Razorpay order creation failed:', error);
        return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
}
