const keyId = 'rzp_live_T1QJI8k222NawQ';
const keySecret = 'eUeYugJhbUx0blv4XVYt1Uvv';
const authString = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
const rzpHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${authString}`
};

async function run() {
  const email = 'tara.stays10@gmail.com';
  console.log(`Checking Razorpay API for email: ${email}...`);

  // Let's try listing accounts (some API credentials allow fetching account by email or reference_id)
  try {
    // 1. Try listing accounts with email filter
    console.log('Method 1: Fetching account by email filter...');
    const res1 = await fetch(`https://api.razorpay.com/v2/accounts?email=${email}`, {
      headers: rzpHeaders
    });
    console.log('Method 1 status:', res1.status);
    const data1 = await res1.json();
    console.log('Method 1 result:', JSON.stringify(data1, null, 2));

    // 2. Try listing accounts generally
    console.log('Method 2: Fetching list of all accounts...');
    const res2 = await fetch(`https://api.razorpay.com/v2/accounts`, {
      headers: rzpHeaders
    });
    console.log('Method 2 status:', res2.status);
    const data2 = await res2.json();
    if (data2 && data2.items) {
      console.log(`Total accounts found: ${data2.items.length}`);
      const matched = data2.items.find(acc => acc.email?.toLowerCase() === email.toLowerCase());
      if (matched) {
        console.log('Found matched account in list:', matched);
      } else {
        console.log('No matched account in the first page of list.');
        console.log('List of emails on first page:', data2.items.map(i => i.email));
      }
    } else {
      console.log('Method 2 response has no items:', data2);
    }
  } catch (err) {
    console.error('Error querying Razorpay API:', err);
  }
}

run();
