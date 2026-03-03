import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listTables() {
    const { data, error } = await supabase.from('information_schema.tables').select('table_name').eq('table_schema', 'public');

    if (error) {
        // try another way
        const { data: data2, error: error2 } = await supabase.rpc('get_tables');
        if (error2) {
            console.error('Error listing tables:', error2);
        } else {
            console.log('Tables:', data2);
        }
    } else {
        console.log('Tables:', data.map(t => t.table_name));
    }
}

listTables();
