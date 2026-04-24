import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStructure() {
    console.log('--- CHECKING USERS TABLE STRUCTURE ---')
    const { data: rpcs, error: rpcError } = await supabase.rpc('get_available_rpcs');
    const { data, error } = await supabase.rpc('exec_sql', { query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';" });

    if (error) {
        console.log('exec_sql RPC not found or failed:', error.message);
    } else {
        console.log('Users Table Columns:', data);
    }
}

checkStructure();
