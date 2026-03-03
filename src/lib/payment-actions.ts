'use server';

import { razorpay } from './razorpay';
import crypto from 'crypto';

export async function createHostSignupOrder() {
    // MOCK IMPLEMENTATION FOR TESTING
    console.log("⚠️ USING MOCK PAYMENT ORDER");
    return {
        success: true,
        orderId: "order_mock_" + Date.now(),
        amount: 29900,
        currency: "INR",
        key_id: "rzp_test_mock_12345",
        error: null
    };
}

export async function verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
) {
    // MOCK IMPLEMENTATION - ALWAYS VERIFY TRUE
    console.log("⚠️ VERIFYING MOCK PAYMENT SIGNATURE");
    return true;
}
