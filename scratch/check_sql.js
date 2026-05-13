const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://dlislsrlwovcxsuqdlvy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzMyNjc1MywiZXhwIjoyMDgyOTAyNzUzfQ.UfXHBCd8FjoXMktEvJjFF37B1xEY2xA99oAGLN03E1Q'
);

async function run() {
  const sql = fs.readFileSync('src/lib/sql/UPDATE_REFERRAL_COMMISSION.sql', 'utf8');
  
  // We can't execute multiple statements easily with supabase-js unless we use a custom RPC or run them one by one.
  // Let's just check if referral_commissions_remaining exists.
  const { data, error } = await supabase.from('users').select('referral_commissions_remaining').limit(1);
  if (error) {
    console.log('Error checking column:', error);
  } else {
    console.log('Column exists! Data:', data);
  }
}

run();
