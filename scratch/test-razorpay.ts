
import { razorpay } from '../src/lib/razorpay';

async function test() {
    console.log('Testing Razorpay keys...');
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    
    console.log('RAZORPAY_KEY_ID exists:', !!key_id);
    console.log('RAZORPAY_KEY_SECRET exists:', !!key_secret);
    
    if (key_id) {
        console.log('ID starts with:', key_id.substring(0, 8));
    }
}

test();
