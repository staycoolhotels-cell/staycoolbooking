import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { razorpay } from '@/lib/razorpay';

/**
 * POST /api/payment/razorpay/create-order
 *
 * Creates a Razorpay order with automatic payment split via Route.
 * Commission is fetched dynamically from commission_rules table.
 * Supports Referral Commission Split for the first 5 bookings.
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
        // 2. Calculate commission dynamically (Guest pays service fee, host pays 0% commission)
        // ─────────────────────────────────────────────
        const adminCommission = Number((booking as any).service_fee || 0);
        const hostAmount = totalAmount - adminCommission;
        const referrerCommission = 0;
        const referrerId = null;
        const commissionType = 'percentage';
        const commissionValue = 0;

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
        
        // Host Payout
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
                on_hold: 0,
            });
        }

        // Referrer Commission Split
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
                on_hold: 0,
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

        // Host and referrer transfers will be executed manually upon check-in.
        // Thus, we do not attach transfers to the order options, so the money goes to the admin first.
        /*
        if (transfers.length > 0) {
            orderOptions.transfers = transfers;
        }
        */

        const order = await razorpay.orders.create(orderOptions);

        // ─────────────────────────────────────────────
        // 5. Persist order ID on booking
        // ─────────────────────────────────────────────
        await supabase
            .from('bookings')
            .update({ razorpay_order_id: order.id })
            .eq('id', bookingId);

        // ─────────────────────────────────────────────
        // 6. Create pending payment_transfers record
        // ─────────────────────────────────────────────
        await supabase
            .from('payment_transfers')
            .upsert(
                {
                    booking_id: bookingId,
                    host_id: hostId,
                    razorpay_order_id: order.id,
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
