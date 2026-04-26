const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkStoragePolicies() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('Checking storage policies for "documents" bucket...');
  const { data, error } = await supabase.rpc('get_policies'); // If exists, but usually not.
  
  // Alternative: Check if we can list objects in the bucket with anon key (if public)
  // or check the bucket settings.
  
  const { data: bucket, error: bucketError } = await supabase.storage.getBucket('documents');
  console.log('Bucket Info:', bucket);

  // Check RLS on storage.objects
  const { data: policies, error: policiesError } = await supabase
    .from('pg_policies') // This might not work via Supabase client easily
    .select('*')
    .eq('tablename', 'objects');
  
  console.log('Policies Error (expected if no access to pg_policies):', policiesError);
}

checkStoragePolicies();
