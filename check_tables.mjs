import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  const tables = ['user_personal_info', 'user_verifications', 'users', 'bookings', 'messages'];
  for (const t of tables) {
    const { error } = await supabaseAdmin.from(t).select('count').limit(1);
    console.log(`Table ${t}: ${error ? 'FAIL (' + error.message + ')' : 'OK'}`);
  }
}

checkTables();
