import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
);

async function run() {
    try {
        const { data, error } = await supabase.rpc('get_schema');
        fs.writeFileSync('schema_debug.json', JSON.stringify({ data, error }, null, 2));
    } catch (e) {
        fs.writeFileSync('schema_debug.json', JSON.stringify({ exception: e.message }, null, 2));
    }
}

run();
