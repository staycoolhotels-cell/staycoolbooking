import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function run() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase.rpc('exec_sql', {
        sql: `SELECT polname, cmd, roles, qual, with_check FROM pg_policy WHERE polrelid = 'public.properties'::regclass;`
    });

    if (error) {
        console.error('RPC Error:', error);
    } else {
        console.log('Policies:\n', JSON.stringify(data, null, 2));
    }
}

run();
