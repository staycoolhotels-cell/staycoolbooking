import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function run() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch one property to see its structure and host_id
    const { data: properties, error: fetchError } = await supabase
        .from('properties')
        .select('*')
        .limit(1);

    if (fetchError) {
        console.error('Fetch Error:', fetchError);
        process.exit(1);
    }

    if (!properties || properties.length === 0) {
        console.log('No properties found.');
        process.exit(0);
    }

    const prop = properties[0];
    console.log('Property Structure:', Object.keys(prop).join(', '));
    console.log('Sample Property ID:', prop.id);
    console.log('Sample Property Host ID:', prop.host_id);
    console.log('Sample Property Status:', prop.status);

    // Check if there are any other RLS policies
    const { data: policies, error: policyError } = await supabase.rpc('exec_sql', {
        sql: "SELECT polname, cmd, roles, qual, with_check FROM pg_policy WHERE polrelid = 'public.properties'::regclass;"
    }).catch(() => ({ data: null, error: 'RPC exec_sql not found' }));

    if (policies) {
        console.log('Actual Policies:\n', JSON.stringify(policies, null, 2));
    } else {
        console.log('Could not fetch policies via RPC.');
    }
}

run();
