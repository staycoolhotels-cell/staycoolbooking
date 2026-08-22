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
const TARGET_EMAIL = 'venkataramananarne@gmail.com';
const USER_ID = 'ac8a6985-2fb7-4e72-bc64-d6d04990ed40';

async function run() {
  console.log('=== Updating Venkata Ramana KYC status ===');

  // Update host_kyc_details table
  console.log('Updating host_kyc_details kyc_status to "activated"...');
  const { data: kycData, error: kycError } = await supabase
    .from('host_kyc_details')
    .update({ 
      kyc_status: 'activated', 
      kyc_error_message: null, 
      updated_at: new Date().toISOString() 
    })
    .eq('email', TARGET_EMAIL)
    .select('*');

  if (kycError) {
    console.error('Error updating host_kyc_details:', kycError);
  } else {
    console.log('✓ Successfully updated host_kyc_details:', kycData);
  }

  // Update users table
  console.log('\nUpdating users table kyc_status to "verified"...');
  const { data: userData, error: userError } = await supabase
    .from('users')
    .update({ kyc_status: 'verified' })
    .eq('id', USER_ID)
    .select('id, name, email, kyc_status');

  if (userError) {
    console.error('Error updating users table:', userError);
  } else {
    console.log('✓ Successfully updated users table:', userData);
  }
}

run();
