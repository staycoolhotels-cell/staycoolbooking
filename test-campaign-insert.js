const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testInsert() {
  console.log('Testing insert...');
  const { data, error } = await supabase.from('campaigns').insert([{
    name: 'Test Campaign',
    type: 'social_media',
    status: 'draft',
    budget: 100,
    spend: 0,
    conversions: 0
  }]).select().single();
  
  if (error) {
    console.error('Error inserting:', error);
  } else {
    console.log('Success:', data);
  }
}

testInsert();
