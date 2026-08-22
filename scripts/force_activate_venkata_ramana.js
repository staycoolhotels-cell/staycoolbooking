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
const ACCOUNT_ID = 'acc_TSiBm2uD6sbTRI';

async function run() {
  console.log(`=== Setting kyc_status to "activated" for ${ACCOUNT_ID} ===`);

  // Update host_kyc_details
  const { data: kycData, error: kycErr } = await supabase
    .from('host_kyc_details')
    .update({
      kyc_status: 'activated',
      kyc_error_message: null
    })
    .eq('razorpay_account_id', ACCOUNT_ID)
    .select('id, user_id, email, razorpay_account_id, kyc_status, bank_account_number');

  if (kycErr) {
    console.error('Error updating host_kyc_details:', kycErr);
    return;
  }
  console.log('✓ host_kyc_details updated:', kycData);

  if (kycData && kycData[0] && kycData[0].user_id) {
    const userId = kycData[0].user_id;
    // Update users table
    const { data: userData, error: userErr } = await supabase
      .from('users')
      .update({ kyc_status: 'verified' })
      .eq('id', userId)
      .select('id, name, email, kyc_status');

    if (userErr) {
      console.error('Error updating users:', userErr);
    } else {
      console.log('✓ users table updated:', userData);
    }
  }
}

run();
