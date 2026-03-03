import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function run() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Find a host and one of their properties
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

    // 2. Simulate the host by creating a client with their ID in a JWT (if possible) 
    // or just use service_role to verify the property can be updated without the status check restriction.

    // Since we can't easily sign in as the host from this script without their password,
    // we will use the service_role to CHECK the property state and then we'll rely on the 
    // RLS policies we've defined.

    // To truly test RLS, we'd need a JWT for the host. 
    // But we can verify the SQL logic:
    // Policy was: WITH CHECK (auth.uid() = host_id AND status <> 'active')
    // New Policy: WITH CHECK (auth.uid() = host_id)

    console.log('Verification Plan:');
    console.log('1. Standardized status to "active" (replacing "approved").');
    console.log('2. Removed "status <> active" restriction from Host Update policy.');
    console.log('3. Admin functions now use "active" status.');

    // Let's check for any properties still using 'approved'
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
