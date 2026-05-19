const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVerifications() {
  const { data, error } = await supabase
    .from('verifications')
    .select('user_id, isIdVerified, file_url, status, updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Verifications Data:');
  console.table(data);
}

checkVerifications();
