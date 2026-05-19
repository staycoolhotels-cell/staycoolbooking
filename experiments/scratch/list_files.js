const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listFiles() {
  const { data, error } = await supabase.storage.from('documents').list('', { limit: 100 });
  if (error) {
    console.error('Error listing root:', error);
    return;
  }
  
  console.log('Folders in documents bucket:');
  for (const item of data) {
    console.log(`- ${item.name} (${item.id ? 'File' : 'Folder'})`);
    if (!item.id) {
       // It's a folder, list contents
       const { data: subData } = await supabase.storage.from('documents').list(item.name);
       if (subData) {
         subData.forEach(sub => console.log(`  - ${item.name}/${sub.name}`));
       }
    }
  }
}

listFiles();
