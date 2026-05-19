
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('id, name');

  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  const teluguUsers = data.filter(u => /[\u0C00-\u0C7F]/.test(u.name || ''));
  console.log('Telugu Users:', teluguUsers);
}

checkUsers();
