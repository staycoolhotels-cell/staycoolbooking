const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

async function run() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase.from('properties').select('*').limit(1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log('--- COLUMNS START ---');
        columns.forEach(c => console.log(c));
        console.log('--- COLUMNS END ---');
    } else {
        console.log('No data found.');
    }
}

run();
