const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testExecuteSql() {
    const { data, error } = await supabase.rpc('execute_sql', { sql_string: 'SELECT 1' });
    if (error) {
        console.error('RPC execute_sql not found or failed:', error);
    } else {
        console.log('RPC execute_sql works:', data);
    }
}

testExecuteSql();
