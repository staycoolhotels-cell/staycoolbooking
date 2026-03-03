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

    // 1. Check the handle_user_update function definition
    const { data: funcData, error: funcError } = await supabase.rpc('inspect_function', { func_name: 'handle_user_update' });

    if (funcError) {
        // If inspect_function doesn't exist, try raw SQL if possible, or just report failure
        console.log('inspect_function RPC not found. Trying to fetch via information_schema...');

        // We can't run raw SQL easily without a custom RPC, but we can try to find and READ the file!
        // Wait, I can't read the DB without an RPC. 
        // Let's see if there's an exec_sql RPC already.
    } else {
        console.log('Function Definition:', funcData);
    }

    // 2. Check current users and their statuses
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
