const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  const { data, error } = await supabase
    .from('verifications')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error fetching verifications:', error);
  } else {
    console.log('Verifications sample data keys:', Object.keys(data[0] || {}));
  }
}

checkSchema();
