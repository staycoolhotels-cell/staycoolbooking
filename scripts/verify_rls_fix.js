import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function run() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id, host_id, status, title')
        .eq('status', 'active')
        .limit(1);

    if (propError || !properties || properties.length === 0) {
        console.error('Could not find an active property to test with.');
        return;
    }

    const property = properties[0];
    console.log(`Testing with Property ID: ${property.id}, Host ID: ${property.host_id}`);
    console.log('Verification Plan:');
    console.log('1. Standardized status to "active" (replacing "approved").');
    console.log('2. Removed "status <> active" restriction from Host Update policy.');
    console.log('3. Admin functions now use "active" status.');
    const { data: approvedProps, error: approvedError } = await supabase
        .from('properties')
        .select('id')
        .eq('status', 'approved');

    if (approvedProps && approvedProps.length > 0) {
        console.log(`Found ${approvedProps.length} properties with "approved" status. They need migration to "active".`);
    } else {
        console.log('No properties found with legacy "approved" status.');
    }

    console.log('\nDeployment Instructions:');
    console.log('Please run the provided FIX_PROPERTY_RLS.sql script in the Supabase SQL Editor.');
}

run();
