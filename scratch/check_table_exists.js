const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTable() {
  const { data: v, error: ve } = await supabase.from('verifications').select('*').limit(1);
  console.log('verifications exists:', !!v, ve?.message);

  const { data: u, error: ue } = await supabase.from('user_identity_docs').select('*').limit(1);
  console.log('user_identity_docs exists:', !!u, ue?.message);
}

checkTable();
