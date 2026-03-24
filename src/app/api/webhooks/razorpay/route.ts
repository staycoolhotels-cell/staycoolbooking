import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase-server';

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

                    // Update payment_transfers to processing/settled
                    await supabase
                        .from('payment_transfers')
                        .update({
                            razorpay_payment_id: razorpayPaymentId,
                            transfer_status: 'processing',
                        })
                        .eq('razorpay_order_id', razorpayOrderId);

                    console.log(`[Webhook] payment.captured: Booking ${bookingId} confirmed.`);
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

                await supabase
                    .from('host_kyc_details')
                    .update({ kyc_status: 'activated' })
                    .eq('razorpay_account_id', account.id);

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
