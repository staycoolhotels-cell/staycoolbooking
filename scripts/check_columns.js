import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function run() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase.rpc('exec_sql', {
        sql: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'properties';`
    }).catch(() => ({ data: null, error: 'RPC not found' }));

    if (data) {
        console.log('Columns:', data.map(c => `${c.column_name} (${c.data_type})`).join(', '));
    } else {
        // Try catching via a simple select
        const { data: sample, error: sampleError } = await supabase.from('properties').select('*').limit(1);
        if (sampleError) {
            console.error('Sample Error:', sampleError);
        } else if (sample && sample.length > 0) {
            console.log('Sample Data Keys:', Object.keys(sample[0]).join(', '));
        } else {
            console.log('No data found to check keys.');
        }
    }
}

run();
