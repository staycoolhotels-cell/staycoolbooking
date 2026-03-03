import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function run() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('Using URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

    // 1. Fetch properties to find one to test with
    const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id, host_id, title, status')
        .limit(5);

    if (propError) {
        console.error('Fetch Properties Error:', propError);
        return;
    }

    console.log('Recent Properties:', JSON.stringify(properties, null, 2));

    if (properties.length > 0) {
        const hostId = properties[0].host_id;
        // 2. Check the user record for this host
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', hostId)
            .single();

        if (userError) {
            console.error('Fetch User Error:', userError);
        } else {
            console.log('Host User Record:', JSON.stringify(user, null, 2));
        }
    }

    // 3. Try to fetch all policies for properties table
    try {
        const { data: policies, error: polError } = await supabase.rpc('exec_sql', {
            sql: "SELECT polname, cmd, roles, qual, with_check FROM pg_policy WHERE polrelid = 'public.properties'::regclass;"
        });
        if (polError) {
            console.error('RPC Policy Error:', polError);
        } else {
            console.log('Current RLS Policies:', JSON.stringify(policies, null, 2));
        }
    } catch (e) {
        console.log('RPC exec_sql probably doesnt exist.');
    }
}

run();
