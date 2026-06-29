const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.substring(1, value.length - 1);
    else if (value.startsWith("'") && value.endsWith("'")) value = value.substring(1, value.length - 1);
    env[key] = value.trim();
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];
const supabase = createClient(supabaseUrl, serviceRoleKey);

const keyId = env['RAZORPAY_KEY_ID'];
const keySecret = env['RAZORPAY_KEY_SECRET'];
const authString = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
const rzpHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Basic ${authString}`
};

const ACCOUNT_ID = 'acc_T7WoQTztgtarKg';

async function run() {
  console.log(`\n=== Fix Route Product ID for ${ACCOUNT_ID} ===\n`);

  // Step 1: Check if any products already exist
  console.log('Step 1: Checking existing products on Razorpay...');
  const listRes = await fetch(`https://api.razorpay.com/v2/accounts/${ACCOUNT_ID}/products`, {
    headers: rzpHeaders
  });
  console.log('  Products list status:', listRes.status);
  const listData = await listRes.json();
  console.log('  Products list response:', JSON.stringify(listData, null, 2));

  let productId = null;

  if (listRes.ok && listData.items && listData.items.length > 0) {
    const routeProduct = listData.items.find(p => p.product_name === 'route' || p.name === 'route');
    if (routeProduct) {
      productId = routeProduct.id;
      console.log(`\n  Found existing route product: ${productId}`);
    }
  }

  if (!productId) {
    // Step 2: Create the route product
    console.log('\nStep 2: Creating Route product via Razorpay API...');
    const createRes = await fetch(`https://api.razorpay.com/v2/accounts/${ACCOUNT_ID}/products`, {
      method: 'POST',
      headers: rzpHeaders,
      body: JSON.stringify({ product_name: 'route', tnc_accepted: true })
    });
    console.log('  Create product status:', createRes.status);
    const createData = await createRes.json();
    console.log('  Create product response:', JSON.stringify(createData, null, 2));

    if (createRes.ok && createData.id) {
      productId = createData.id;
      console.log(`\n  ✓ Route product created: ${productId}`);
    } else {
      console.error('\n  ✗ Failed to create Route product. Cannot proceed.');
      return;
    }
  }

  // Step 3: Update the database with the real product ID
  console.log(`\nStep 3: Updating database with real product ID: ${productId}`);
  const { data, error } = await supabase
    .from('host_kyc_details')
    .update({ razorpay_product_id: productId })
    .eq('razorpay_account_id', ACCOUNT_ID)
    .select();

  if (error) {
    console.error('  ✗ DB update error:', error);
  } else {
    console.log('  ✓ Database updated successfully!');
    console.log('  Updated record:', JSON.stringify(data, null, 2));
  }
}

run();
