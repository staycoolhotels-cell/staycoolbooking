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
const BANK_ACCOUNT_NUMBER = '32394071757';

async function run() {
  console.log('=== Checking Venkata Ramana host_kyc_details record ===');

  const { data: record, error: fetchErr } = await supabase
    .from('host_kyc_details')
    .select('*')
    .eq('email', TARGET_EMAIL)
    .single();

  if (fetchErr) {
    console.error('Error fetching record:', fetchErr);
    return;
  }

  console.log('Current record before update:', record);

  console.log(`\nUpdating bank_account_number to "${BANK_ACCOUNT_NUMBER}"...`);
  const { data, error } = await supabase
    .from('host_kyc_details')
    .update({ bank_account_number: BANK_ACCOUNT_NUMBER, updated_at: new Date().toISOString() })
    .eq('email', TARGET_EMAIL)
    .select('*');

  if (error) {
    console.error('Error updating bank_account_number:', error);
  } else {
    console.log('✓ Successfully updated Venkata Ramana bank_account_number:', data);
  }
}

run();
