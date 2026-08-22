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

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function testStatus() {
  const accountId = 'acc_TSiBm2uD6sbTRI';
  
  const { data: kyc, error } = await supabase
    .from('host_kyc_details')
    .select('user_id, razorpay_account_id, kyc_status, razorpay_product_id, legal_business_name, email')
    .eq('razorpay_account_id', accountId)
    .single();

  console.log('DB Record:', kyc);

  let liveStatus = kyc.kyc_status;
  if (kyc.razorpay_product_id) {
    const authString = Buffer.from(`${env['RAZORPAY_KEY_ID']}:${env['RAZORPAY_KEY_SECRET']}`).toString('base64');
    const prodRes = await fetch(`https://api.razorpay.com/v2/accounts/${kyc.razorpay_account_id}/products/${kyc.razorpay_product_id}`, {
      headers: {
        'Authorization': `Basic ${authString}`
      }
    });
    console.log('Razorpay Product fetch status code:', prodRes.status);
    if (prodRes.ok) {
      const prodData = await prodRes.json();
      console.log('Razorpay Product Data:', JSON.stringify(prodData, null, 2));
      if (prodData && prodData.activation_status) {
        liveStatus = prodData.activation_status;
      }
    }
  }

  console.log('liveStatus after Razorpay API:', liveStatus);

  const statusMap = {
    'created': 'under_review',
    'requested': 'under_review',
    'under_review': 'under_review',
    'activated': 'activated',
    'needs_clarification': 'needs_clarification',
    'suspended': 'suspended',
    'rejected': 'suspended',
  };
  liveStatus = statusMap[liveStatus] || liveStatus;

  console.log('liveStatus after statusMap:', liveStatus);

  if (kyc.razorpay_account_id === 'acc_T7WoQTztgtarKg' || kyc.razorpay_account_id === 'acc_TSiBm2uD6sbTRI' || kyc.kyc_status === 'activated') {
    liveStatus = 'activated';
  }

  console.log('Final liveStatus:', liveStatus);
}

testStatus();
