import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEverywhere() {
    console.log('Checking for "disputes" table in all schemas...');
    const { data, error } = await supabase.from('information_schema.tables').select('table_schema, table_name').ilike('table_name', '%disputes%');

    if (error) {
        console.error('Query error:', error);
    } else {
        console.log('Found tables:', data);
    }

    console.log('Checking if "run_sql" rpc exists...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_table_columns', { table_name: 'disputes' });
    console.log('RPC result:', { rpcData, rpcError: rpcError?.message });
}

checkEverywhere();
