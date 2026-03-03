import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTableExistence() {
    const { data, error } = await supabase.rpc('inspect_table_exists', { t_name: 'disputes' });

    if (error) {
        // RPC might not exist, try direct query on pg_class or similar if possible
        // But easier: try a select on a table that DEFINITELY exists
        const { data: users, error: userError } = await supabase.from('users').select('count', { count: 'exact', head: true });
        console.log('Users table check:', { exists: !userError, error: userError?.message });

        const { data: disputes, error: disputeError } = await supabase.from('disputes').select('count', { count: 'exact', head: true });
        console.log('Disputes table check:', { exists: !disputeError, error: disputeError?.message });
    } else {
        console.log('Table exists:', data);
    }
}

checkTableExistence();
