import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('--- DIAGNOSING DATABASE TRIGGER ---');
    const { data: funcData, error: funcError } = await supabase.rpc('inspect_function', { func_name: 'handle_user_update' });

    if (funcError) {
        console.log('inspect_function RPC not found. Trying to fetch via information_schema...');
    } else {
        console.log('Function Definition:', funcData);
    }

    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, role, status')
        .limit(10);

    if (userError) {
        console.error('Error fetching users:', userError);
    } else {
        console.log('Recent Users:', userData);
    }
}

diagnose();
