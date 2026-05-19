const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function verifyAll() {
    console.log('--- FUNCTION DEFINITION CHECK ---');
    const results = {};
    try {
        const { data, error } = await supabaseAdmin.rpc('get_function_def', {
            fn_name: 'create_bulk_booking'
        });

        // If helper rpc doesn't exist, try a direct query
        if (error) {
            const { data: qData, error: qErr } = await supabaseAdmin
                .from('pg_proc')
                .select('prosrc')
                .eq('proname', 'create_bulk_booking')
                .limit(1)
                .schema('pg_catalog');

            results.function_source = qData ? qData[0].prosrc : null;
            results.error = qErr ? qErr.message : null;
        } else {
            results.function_source = data;
        }

    } catch (e) {
        results.critical_error = e.message;
    }

    fs.writeFileSync('verification-results.json', JSON.stringify(results, null, 2));
    console.log('RESULTS_SAVED');
}

verifyAll();
