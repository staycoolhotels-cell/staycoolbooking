const keyId = 'rzp_live_T1QJI8k222NawQ';
const keySecret = 'eUeYugJhbUx0blv4XVYt1Uvv';
const authString = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
const rzpHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${authString}`
};

async function run() {
  const accountId = 'acc_T7WoQTztgtarKg';
  console.log(`Checking Razorpay products for account: ${accountId}...`);

  try {
    const res = await fetch(`https://api.razorpay.com/v2/accounts/${accountId}/products`, {
      headers: rzpHeaders
    });
    console.log('Response status:', res.status);
    const data = await res.json();
    console.log('Result:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
