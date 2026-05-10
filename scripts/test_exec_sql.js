const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testExecSql() {
    const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
    if (error) {
        console.error('RPC exec_sql not found or failed:', error);
    } else {
        console.log('RPC exec_sql works:', data);
    }
}

testExecSql();
