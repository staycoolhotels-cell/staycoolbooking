const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('Querying Supabase Auth admin API...');
  
  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('Error listing auth users:', error);
  } else {
    const matchingUsers = users.filter(u => 
      (u.email && u.email.includes('7207529812')) || 
      (u.phone && u.phone.includes('7207529812')) ||
      (u.user_metadata && JSON.stringify(u.user_metadata).includes('7207529812'))
    );
    console.log('Matching auth users found:', matchingUsers.map(u => ({
      id: u.id,
      email: u.email,
      phone: u.phone,
      user_metadata: u.user_metadata,
      created_at: u.created_at
    })));
  }
}

main();
