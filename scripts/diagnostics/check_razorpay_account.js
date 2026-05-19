const Razorpay = require('razorpay');
require('dotenv').config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function run() {
  try {
    const account = await razorpay.accounts.fetch('acc_ShQcnL04UPZzlB');
    console.log(JSON.stringify(account, null, 2));
  } catch (error) {
    console.error(error);
  }
}
run();
