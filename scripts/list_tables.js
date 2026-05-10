const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listTables() {
    // Supabase doesn't have a direct "list tables" in the JS SDK easily without RPC or querying pg_catalog
    // But we can try to guess or use a query that often works if permissions allow
    const { data, error } = await supabase.rpc('get_tables'); // Custom RPC if it exists
    if (error) {
        console.log('RPC get_tables failed, trying query');
        const { data: data2, error: error2 } = await supabase.from('pg_catalog.pg_tables').select('tablename').eq('schemaname', 'public');
        if (error2) {
             console.error('Error fetching tables:', error2);
        } else {
            console.log('Tables:', data2);
        }
    } else {
        console.log('Tables:', data);
    }
}

listTables();
