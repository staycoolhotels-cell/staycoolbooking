const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRelationships() {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, properties!inner(*), guest:users!guest_id(name, avatar_url, verifications(file_url, status))')
    .limit(1);
  
  if (error) {
    console.error('Join Error:', error);
  } else {
    console.log('Join Success! Sample data:', JSON.stringify(data[0], null, 2));
  }
}

checkRelationships();
