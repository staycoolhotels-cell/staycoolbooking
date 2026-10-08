import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase-server';
import { createNotification } from '@/lib/activity-actions';

/**
 * POST /api/webhooks/razorpay
 *
 * Handles Razorpay webhook events:
 * - payment.captured  → confirm booking, mark transfer as settled
 * - payment.failed    → mark booking payment_failed
 * - transfer.settled  → mark payment_transfers record settled
 *
 * IMPORTANT: Add RAZORPAY_WEBHOOK_SECRET to your .env
 * and configure this URL in Razorpay Dashboard → Webhooks.
 */
export async function POST(req: Request) {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    // ─────────────────────────────────────────────
    // 1. Verify webhook signature
    // ─────────────────────────────────────────────
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error('[Webhook] RAZORPAY_WEBHOOK_SECRET is not configured.');
        return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    if (!signature) {
        return NextResponse.json({ error: 'Missing webhook signature' }, { status: 400 });
    }

    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

    if (expectedSignature !== signature) {
        console.error('[Webhook] Signature mismatch. Possible tampering.');
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    // ─────────────────────────────────────────────
    // 2. Parse event
    // ─────────────────────────────────────────────
    let event: any;
    try {
        event = JSON.parse(body);
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const eventType = event.event;
    const payload = event.payload;

    console.log(`[Webhook] Received event: ${eventType}`);

    // Use service role client (bypasses RLS for webhook processing)
    const supabase = createServiceClient();

    // ─────────────────────────────────────────────
    // 3. Handle events
    // ─────────────────────────────────────────────
    try {
        switch (eventType) {

            case 'payment.captured': {
                const payment = payload?.payment?.entity;
                if (!payment) break;

                const razorpayOrderId = payment.order_id;
                const razorpayPaymentId = payment.id;
                const bookingId = payment.notes?.booking_id;

                if (bookingId) {
                    // Update booking to confirmed
                    await supabase
                        .from('bookings')
                        .update({
                            status: 'confirmed',
                            razorpay_payment_id: razorpayPaymentId,
                        })
                        .eq('id', bookingId)
                        .neq('status', 'confirmed'); // Don't re-update already confirmed

                    // Update payment_transfers with the payment ID but keep status as pending (to be split on check-in)
                    await supabase
                        .from('payment_transfers')
                        .update({
                            razorpay_payment_id: razorpayPaymentId,
                            transfer_status: 'pending',
                        })
                        .eq('razorpay_order_id', razorpayOrderId);

                    console.log(`[Webhook] payment.captured: Booking ${bookingId} confirmed.`);

                    // 4. Record Transaction (Secondary Ledger)
                    try {
                        const { data: booking } = await supabase
                            .from('bookings')
                            .select('*, property:properties(*)')
                            .eq('id', bookingId)
                            .single();

                        if (booking) {
                            const amount = Number(booking.total_price);
                            // Zero commission from guest. Commission (10%) is deducted solely from Host payout.
                            const guestServiceFee = 0;
                            const hostPayout = Number((amount * 0.90).toFixed(2));
                            const platformFee = Number((amount - hostPayout).toFixed(2));

                            await supabase
                                .from('transactions')
                                .insert({
                                    booking_id: bookingId,
                                    guest_id: booking.guest_id,
                                    host_id: booking.property?.host_id,
                                    property_id: booking.property_id,
                                    amount: amount,
                                    platform_fee: platformFee,
                                    host_payout: hostPayout,
                                    status: 'completed'
                                });
                            
                            const propTitle = booking.property?.title || 'Hotel Stay';
                            const bookingRef = `#${bookingId.slice(0, 8).toUpperCase()}`;

                            // 1. Guest Notification
                            if (booking.guest_id) {
                                await createNotification(
                                    'booking',
                                    '🎉 Booking Confirmed!',
                                    `Your reservation ${bookingRef} for "${propTitle}" is confirmed. Enjoy your stay!`,
                                    'success',
                                    booking.guest_id,
                                    'guest',
                                    '/user-profile'
                                );
                            }

                            // 2. Host Notification
                            if (booking.property?.host_id) {
                                await createNotification(
                                    'booking',
                                    '🏨 New Reservation Received!',
                                    `New booking ${bookingRef} for "${propTitle}". Total: ₹${amount}. Payout scheduled on check-in.`,
                                    'success',
                                    booking.property.host_id,
                                    'host',
                                    '/host-dashboard'
                                );
                            }

                            // 3. Admin Notification
                            await createNotification(
                                'booking',
                                '💼 Booking Payment Captured',
                                `Payment captured for booking ${bookingRef}. Amount: ₹${amount}, Commission: ₹${platformFee}.`,
                                'success',
                                null,
                                'admin',
                                '/admin-panel'
                            );
                        }
                    } catch (txnError) {
                        console.error('[Webhook] Secondary transaction logging failed:', txnError);
                    }
                }
                break;
            }

            case 'payment.failed': {
                const payment = payload?.payment?.entity;
                if (!payment) break;

                const razorpayOrderId = payment.order_id;
                const bookingId = payment.notes?.booking_id;
                const failureReason = payment.error_description || 'Payment failed';

                if (bookingId) {
                    // Mark booking as payment_failed
                    await supabase
                        .from('bookings')
                        .update({ status: 'payment_failed' })
                        .eq('id', bookingId)
                        .eq('status', 'pending_payment');

                    // Mark transfer as failed
                    await supabase
                        .from('payment_transfers')
                        .update({
                            transfer_status: 'failed',
                            failure_reason: failureReason,
                        })
                        .eq('razorpay_order_id', razorpayOrderId);

                    console.log(`[Webhook] payment.failed: Booking ${bookingId} marked as failed. Reason: ${failureReason}`);
                }
                break;
            }

            case 'transfer.settled': {
                const transfer = payload?.transfer?.entity;
                if (!transfer) break;

                const razorpayTransferId = transfer.id;
                const razorpaySourceId = transfer.source; // The payment_id this transfer came from

                // Update the payment_transfers record to settled
                await supabase
                    .from('payment_transfers')
                    .update({
                        razorpay_transfer_id: razorpayTransferId,
                        transfer_status: 'settled',
                    })
                    .eq('razorpay_payment_id', razorpaySourceId);

                console.log(`[Webhook] transfer.settled: Transfer ${razorpayTransferId} settled.`);
                
                // Find host to notify
                const { data: xfer } = await supabase
                    .from('payment_transfers')
                    .select('host_amount, booking_id, bookings(property:properties(host_id))')
                    .eq('razorpay_payment_id', razorpaySourceId)
                    .maybeSingle();

                const hostId = (xfer as any)?.bookings?.property?.host_id;
                if (hostId) {
                    await createNotification(
                        'payout',
                        '💰 Payout Settled!',
                        `Host payout of ₹${xfer?.host_amount || ''} for booking #${xfer?.booking_id?.slice(0, 8) || ''} has been settled to your bank account.`,
                        'success',
                        hostId,
                        'host',
                        '/host-dashboard'
                    );
                }

                // Log Notification for Admin
                await createNotification(
                    'payout',
                    '💼 Host Payout Settled',
                    `Payout transfer ${razorpayTransferId} has been settled successfully.`,
                    'success',
                    null,
                    'admin',
                    '/admin-panel'
                );
                break;
            }

            case 'transfer.failed': {
                const transfer = payload?.transfer?.entity;
                if (!transfer) break;

                const razorpayTransferId = transfer.id;
                const razorpaySourceId = transfer.source;
                const failureReason = transfer.error?.description || 'Transfer failed';

                await supabase
                    .from('payment_transfers')
                    .update({
                        razorpay_transfer_id: razorpayTransferId,
                        transfer_status: 'failed',
                        failure_reason: failureReason,
                    })
                    .eq('razorpay_payment_id', razorpaySourceId);

                console.log(`[Webhook] transfer.failed: Transfer ${razorpayTransferId} failed.`);
                break;
            }

            case 'account.activated': {
                // Razorpay Route linked account KYC approved
                const account = payload?.account?.entity;
                if (!account) break;

                // Update host_kyc_details status
                await supabase
                    .from('host_kyc_details')
                    .update({ kyc_status: 'activated' })
                    .eq('razorpay_account_id', account.id);

                // Also sync users.kyc_status to 'verified'
                const { data: kycRecord } = await supabase
                    .from('host_kyc_details')
                    .select('user_id')
                    .eq('razorpay_account_id', account.id)
                    .single();

                if (kycRecord?.user_id) {
                    await supabase
                        .from('users')
                        .update({ kyc_status: 'verified' })
                        .eq('id', kycRecord.user_id);
                    console.log(`[Webhook] account.activated: Synced users.kyc_status=verified for user ${kycRecord.user_id}`);
                }

                console.log(`[Webhook] account.activated: Account ${account.id} is now activated.`);
                break;
            }

            case 'account.needs_clarification': {
                const account = payload?.account?.entity;
                if (!account) break;

                await supabase
                    .from('host_kyc_details')
                    .update({
                        kyc_status: 'needs_clarification',
                        kyc_error_message: account.verification?.profile?.reason || 'Razorpay requires clarification.',
                    })
                    .eq('razorpay_account_id', account.id);

                console.log(`[Webhook] account.needs_clarification: Account ${account.id}.`);
                break;
            }

            case 'refund.processed': {
                const refund = payload?.refund?.entity;
                if (!refund) break;

                const razorpayPaymentId = refund.payment_id;
                const bookingId = refund.notes?.booking_id;

                if (bookingId) {
                    // 1. Update Booking Status
                    await supabase
                        .from('bookings')
                        .update({ status: 'refunded' })
                        .eq('id', bookingId);

                    // 2. Update Secondary Ledger
                    await supabase
                        .from('transactions')
                        .update({ status: 'refunded' })
                        .eq('booking_id', bookingId);
                    
                    console.log(`[Webhook] refund.processed: Booking ${bookingId} marked as refunded.`);
                    
                    const refundRupees = refund.amount / 100;
                    // 3. Notify Guest and Admin
                    const { data: bData } = await supabase
                        .from('bookings')
                        .select('guest_id')
                        .eq('id', bookingId)
                        .maybeSingle();

                    if (bData?.guest_id) {
                        await createNotification(
                            'booking',
                            '💰 Refund Processed',
                            `Refund of ₹${refundRupees} has been processed for booking #${bookingId.slice(0, 8)}.`,
                            'success',
                            bData.guest_id,
                            'guest',
                            '/user-profile'
                        );
                    }

                    await createNotification(
                        'booking',
                        '🔄 Refund Processed',
                        `Refund of ₹${refundRupees} processed for booking #${bookingId.slice(0, 8)}.`,
                        'info',
                        null,
                        'admin',
                        '/admin-panel'
                    );
                } else if (razorpayPaymentId) {
                    // Fallback: Find booking by payment ID if booking_id not in notes
                    const { data: booking } = await supabase
                        .from('bookings')
                        .select('id')
                        .eq('razorpay_payment_id', razorpayPaymentId)
                        .maybeSingle();
                    
                    if (booking) {
                        await supabase
                            .from('bookings')
                            .update({ status: 'refunded' })
                            .eq('id', booking.id);
                        
                        await supabase
                            .from('transactions')
                            .update({ status: 'refunded' })
                            .eq('booking_id', booking.id);

                        console.log(`[Webhook] refund.processed: Booking ${booking.id} marked as refunded (found via payment ID).`);

                        await createNotification(
                            'booking',
                            'Refund Processed',
                            `Refund of ₹${refund.amount / 100} processed for booking ${booking.id}.`,
                            'info'
                        );
                    }
                }
                break;
            }

            case 'refund.failed': {
                const refund = payload?.refund?.entity;
                if (!refund) break;
                const bookingId = refund.notes?.booking_id;
                
                if (bookingId) {
                    await createNotification(
                        'booking',
                        'Refund Failed',
                        `Refund for booking ${bookingId} failed. Reason: ${refund.error_description || 'Unknown'}`,
                        'error'
                    );
                }
                break;
            }

            default:
                console.log(`[Webhook] Unhandled event type: ${eventType}`);
        }
    } catch (handlerError: any) {
        console.error(`[Webhook] Error handling event ${eventType}:`, handlerError);
        // Always return 200 to Razorpay to prevent retries for handler errors
    }

    // Always return 200 immediately — Razorpay requires fast acknowledgement
    return NextResponse.json({ received: true, event: eventType });
}
