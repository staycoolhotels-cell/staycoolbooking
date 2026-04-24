const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

async function run() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );


    const { data, error } = await supabase.from('properties').select('*').limit(1);

    if (error) {
        console.error('Error fetching sample property:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns in properties table:', Object.keys(data[0]).join(', '));
    } else {
        const { data: cols, error: colError } = await supabase.rpc('exec_sql', {
            sql: "SELECT column_name FROM information_schema.columns WHERE table_name = 'properties';"
        }).catch(() => ({ data: null, error: 'RPC failed' }));

        if (cols) {
            console.log('Columns from information_schema:', cols.map(c => c.column_name).join(', '));
        } else {
            console.log('No properties found and RPC failed. Cannot determine columns.');
        }
    }
}

run();
