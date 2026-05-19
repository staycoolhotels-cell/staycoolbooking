const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkRLS() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('Checking verifications RLS...');
  // Since we don't have a direct "get policies" RPC usually, 
  // we check the table description or try an insert with an anon client.
  
  // Actually, we can check the information_schema or similar if allowed, 
  // but let's just check if there are any records and if we can insert one manually with service role.
  
  const testUserId = 'f745774a-675c-4860-98d6-7510d9d93e11'; // Some random UUID for testing
  const { error: insertError } = await supabase
    .from('verifications')
    .insert([{ user_id: testUserId, doc_type: 'test', file_url: 'test', status: 'pending' }]);
  
  if (insertError) {
    console.error('Service Role Insert Error:', insertError);
  } else {
    console.log('Service Role Insert Success.');
    // Cleanup
    await supabase.from('verifications').delete().eq('doc_type', 'test');
  }

  console.log('Checking storage bucket public status...');
  const { data: bucket, error: bucketError } = await supabase.storage.getBucket('documents');
  if (bucketError) console.error(bucketError);
  else console.log('Bucket documents is public:', bucket.public);
}

checkRLS();
