import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
);

async function runTest() {
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql_string: "SELECT 1;" });
    fs.writeFileSync('error_out.json', JSON.stringify(error || { success: true }));
}

runTest();
