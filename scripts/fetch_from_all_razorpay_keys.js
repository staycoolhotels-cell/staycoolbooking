const keys = [
  { id: 'rzp_live_T1QJI8k222NawQ', secret: 'eUeYugJhbUx0blv4XVYt1Uvv', name: 'Current Live Key' },
  { id: 'rzp_test_SiBZP6b7HsMina', secret: '6UrjlvfzN65Qj08u8HKyLpZ3', name: 'Test Key Apr 27' },
  { id: 'rzp_live_ShPY8kZqD12YVn', secret: 'w7gtDDa7M3hB0nbsWsF3kVuZ', name: 'Live Key Apr 27' },
  { id: 'rzp_test_Sf1USpPZtGtjxT', secret: '0FJ1DNZhhZhNjIPWtNW68GKy', name: 'Test Key Apr 25' },
  { id: 'rzp_live_SVvK2Evg4plXy2', secret: 'r6X4W3j0gf0XiIkdYfYCr5YV', name: 'Live Key Mar 27' },
  { id: 'rzp_test_SIl7fxdTqfcbGn', secret: 'seEVGiMqc8eDpzXId8lmM8Yi', name: 'Test Key Mar 4' }
];

async function checkKey(key, email) {
  const authString = Buffer.from(`${key.id}:${key.secret}`).toString('base64');
  const rzpHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${authString}`
  };

  try {
    // 1. Try fetching directly if there is a search/list
    const res = await fetch(`https://api.razorpay.com/v2/accounts?email=${email}`, {
      headers: rzpHeaders
    });
    const status = res.status;
    const data = await res.json();
    console.log(`Key: ${key.name} (${key.id}) - Status: ${status}`);
    if (status === 200) {
      console.log(`  MATCH FOUND:`, JSON.stringify(data, null, 2));
      return { key, data };
    }
  } catch (err) {
    console.error(`  Error for key ${key.name}:`, err.message);
  }
  return null;
}

async function run() {
  const email = 'tara.stays10@gmail.com';
  console.log(`Scanning all historical Razorpay keys for account associated with: ${email}...`);

  for (const key of keys) {
    const result = await checkKey(key, email);
    if (result) {
      console.log('\nSUCCESS! Account details found:');
      console.log(result);
      break;
    }
  }
  console.log('\nScan complete.');
}

run();
