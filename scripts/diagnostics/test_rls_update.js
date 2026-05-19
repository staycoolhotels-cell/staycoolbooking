import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function run() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: properties, error: fetchError } = await supabase
        .from('properties')
        .select('id, status')
        .limit(1);

    if (fetchError) {
        console.error('Fetch Error:', fetchError);
        process.exit(1);
    }

    if (!properties || properties.length === 0) {
        console.log('No properties found.');
        process.exit(0);
    }

    const propertyId = properties[0].id;
    console.log(`Updating property: ${propertyId}`);

    const { data, error } = await supabase
        .from('properties')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', propertyId);

    if (error) {
        console.error('Update Error:', error);
    } else {
        console.log('Update Success:', data);
    }
}

run();
