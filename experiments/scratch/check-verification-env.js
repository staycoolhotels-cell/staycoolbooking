const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkDb() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('Checking tables...');
  const { data: tables, error: tablesError } = await supabase
    .from('verifications')
    .select('*')
    .limit(1);
  
  if (tablesError) {
    console.error('Error fetching verifications:', tablesError);
  } else {
    console.log('Verifications table exists.');
  }

  console.log('Checking storage...');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError) {
    console.error('Error listing buckets:', bucketsError);
  } else {
    console.log('Buckets:', buckets.map(b => b.name));
    const hasDocs = buckets.some(b => b.name === 'documents');
    if (!hasDocs) {
      console.log('Creating documents bucket...');
      const { data, error } = await supabase.storage.createBucket('documents', {
        public: false,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        fileSizeLimit: 5242880 // 5MB
      });
      if (error) console.error('Error creating bucket:', error);
      else console.log('Bucket created.');
    }
  }
}

checkDb();
