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
const TARA_USER_ID = 'b7a9b83c-832c-48a4-bb6c-8b15cfdcf061';

async function run() {
  console.log('=== Checking Tara user record ===');

  // First check current state
  const { data: user } = await supabase
    .from('users')
    .select('id, name, email, kyc_status')
    .eq('id', TARA_USER_ID)
    .single();

  console.log('Current user record:', user);

  // Update kyc_status to verified
  console.log('\nUpdating kyc_status to "verified"...');
  const { data, error } = await supabase
    .from('users')
    .update({ kyc_status: 'verified' })
    .eq('id', TARA_USER_ID)
    .select('id, name, email, kyc_status');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✓ Updated successfully:', data);
  }
}

run();
