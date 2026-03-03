import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { razorpay } from '@/lib/razorpay';

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

        // Fetch Booking Details with Property and Host Info
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select(`
                id, 
                total_price, 
                status,
                property:properties!property_id (
                    host_id
                )
            `)
            .eq('id', bookingId)
            .single();

        if (bookingError || !booking) {
            console.error("Booking fetch error:", bookingError);
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Fetch Host's Razorpay Account ID
        // Note: property is single object because of !property_id relation or array?
        // Usually properties is singular if property_id is FK.
        // But Typescript might complain.
        const hostId = (booking.property as any)?.host_id;

        let transfers = [];
        const totalAmount = Number(booking.total_price);
        let payableAmount = totalAmount;
        let isSplitPayment = false;

        if (totalAmount > 100000) {
            payableAmount = totalAmount / 2;
            isSplitPayment = true;
        }

        const amount = Math.round(payableAmount * 100); // Amount in paise
        // The `transfers` array was declared twice in the original code.
        // The new code provided by the user also has `let transfers = [];` here.
        // To avoid redeclaration, I will keep the first declaration and remove this one.
        // let transfers = []; 

        if (hostId) {
            const { data: wallet } = await supabase
                .from('user_wallets')
                .select('razorpay_account_id')
                .eq('user_id', hostId)
                .single();

            if (wallet?.razorpay_account_id) {
                // Guest pays 10% on top of base amount (totalAmount = baseAmount * 1.1)
                // We need to reverse-calculate the base amount to deduct the 10% correctly.
                const baseAmount = totalAmount / 1.1;

                // Platform fee is 20% of base amount (10% from guest, 10% from host)
                const platformFee = baseAmount * 0.20;

                // Host's total share (90% of base amount, meaning 10% service fee is deducted)
                const totalHostShare = baseAmount * 0.90;

                let transferAmount = 0;

                if (isSplitPayment) {
                    // Host collects 50% offline directly
                    const offlineCollection = totalAmount / 2;
                    transferAmount = totalHostShare - offlineCollection;
                } else {
                    // Full payment online, transfer full host share
                    transferAmount = totalHostShare;
                }

                if (transferAmount > 0) {
                    transfers.push({
                        account: wallet.razorpay_account_id,
                        amount: Math.round(transferAmount * 100), // Convert to paise
                        currency: 'INR',
                        notes: {
                            booking_id: bookingId,
                            type: 'host_payout',
                            split_payment: isSplitPayment ? 'yes' : 'no'
                        },
                        linked_account_notes: [
                            'booking_id'
                        ],
                        on_hold: 0
                    });
                }
            }
        }
        const currency = 'INR';

        const options: any = {
            amount: amount.toString(),
            currency,
            receipt: bookingId,
            notes: {
                booking_id: bookingId,
                guest_id: user.id
            }
        };

        if (transfers.length > 0) {
            options.transfers = transfers;
        }

        const order = await razorpay.orders.create(options);

        // Update booking with order ID? Not strictly matching yet, but good for tracking.
        // We can rely on notes for now.

        return NextResponse.json({
            orderId: order.id,
            amount: amount,
            currency: currency,
            keyId: process.env.RAZORPAY_KEY_ID
        });

    } catch (error: any) {
        console.error('Razorpay Order creation failed:', error);
        return NextResponse.json({ error: error.message || 'Error creating order' }, { status: 500 });
    }
}
