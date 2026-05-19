
const Razorpay = require('razorpay');
require('dotenv').config();

async function test() {
    console.log('--- Razorpay Connection Diagnostic ---');
    console.log('KEY_ID:', process.env.RAZORPAY_KEY_ID ? 'Exists (' + process.env.RAZORPAY_KEY_ID.substring(0, 8) + '...)' : 'MISSING');
    
    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    try {
        console.log('1. Attempting to fetch recent payments...');
        const response = await razorpay.payments.all({ count: 1 });
        console.log('✅ Connection Successful: Payments API reachable.');
        
        console.log('2. Attempting to access Accounts API (Route)...');
        try {
            // Check if accounts property exists and try a fetch
            if (razorpay.accounts) {
                await razorpay.accounts.fetch('acc_random_id');
            } else {
                console.log('❌ Error: razorpay.accounts is undefined in this SDK version.');
            }
        } catch (accErr) {
            console.log('Accounts API Response:', accErr.message || accErr.description);
            // If it says "The requested entity was not found", it means we HAD access but the ID was fake.
            // If it says "Access Denied", we don't have permission.
            if (accErr.error) {
                console.log('Detailed Error:', JSON.stringify(accErr.error, null, 2));
            }
        }
    } catch (err) {
        console.log('❌ General Error:', err.message);
        if (err.error) console.log('Error Details:', JSON.stringify(err.error, null, 2));
    }
}

test();
