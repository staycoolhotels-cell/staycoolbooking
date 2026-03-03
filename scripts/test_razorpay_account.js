import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import path from 'path';

// Load directly from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log("Key ID is:", process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.substring(0, 5) + "...");

const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function test() {
    try {
        const account = await razorpay.accounts.create({
            type: 'route',
            name: 'Test Setup',
            email: 'test@example.com',
        });
        console.log('Success:', account);
    } catch (error) {
        console.error('Error creating account:', JSON.stringify(error, null, 2));
    }
}

test();
