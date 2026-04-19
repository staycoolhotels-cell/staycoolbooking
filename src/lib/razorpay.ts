import Razorpay from 'razorpay';

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

if (!key_id || !key_secret) {
    console.warn('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing. Payment functionality will not work.');
} else {
    console.log('Razorpay keys detected. ID starts with:', key_id.substring(0, 8));
}

export const razorpay = new Razorpay({
    key_id: key_id || 'rzp_test_placeholder',
    key_secret: key_secret || 'placeholder_secret',
});
