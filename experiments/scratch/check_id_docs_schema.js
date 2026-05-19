const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  const { data, error } = await supabase
    .from('user_identity_docs')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error fetching user_identity_docs:', error);
  } else {
    console.log('user_identity_docs sample data keys:', Object.keys(data[0] || {}));
    console.log('Sample data:', data[0]);
  }
}

checkSchema();
