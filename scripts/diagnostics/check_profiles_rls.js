import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
);

async function checkProfiles() {
    const { data: users, error: polErr } = await supabase.from('users').select('id').limit(1);
    const { data: profile } = await supabase.from('profiles').select('id').limit(1);


    const sql = `SELECT * FROM pg_policies WHERE tablename = 'profiles';`
    const { data: policies } = await supabase.rpc('execute_sql', { sql_string: sql });

    fs.writeFileSync('profiles_debug.json', JSON.stringify({
        hasUsers: users?.length > 0,
        hasProfiles: profile?.length > 0,
        policies: policies
    }, null, 2));
}

checkProfiles();
