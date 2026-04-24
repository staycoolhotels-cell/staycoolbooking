'use server';

import { razorpay } from './razorpay';
import crypto from 'crypto';

export async function createHostSignupOrder() {
    try {
        const key_id = process.env.RAZORPAY_KEY_ID;
        if (!key_id) {
            throw new Error('RAZORPAY_KEY_ID is not configured');
        }

        const options = {
            amount: 29900, // Amount in paise (299 INR)
            currency: "INR",
            receipt: "receipt_host_signup_" + Date.now(),
        };

        const order = await razorpay.orders.create(options);
        
        return {
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: key_id,
            error: null
        };
    } catch (error: any) {
        console.error('Error creating Razorpay order:', error);
        return {
            success: false,
            orderId: null,
            amount: 0,
            currency: "INR",
            key_id: null,
            error: 'An unexpected error occurred. Please try again.'
        };
    }
}

export async function verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
) {
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
        console.error('RAZORPAY_KEY_SECRET is not configured');
        return false;
    }

    const generated_signature = crypto
        .createHmac('sha256', key_secret)
        .update(orderId + "|" + paymentId)
        .digest('hex');

    return generated_signature === signature;
}
