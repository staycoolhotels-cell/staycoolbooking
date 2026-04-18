import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsersSchema() {
  const { data: columns, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error("Error fetching from users table:", error);
  } else {
    console.log("Columns from first row:", Object.keys(columns[0] || {}));
  }
}

checkUsersSchema();
