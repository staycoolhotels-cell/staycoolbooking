const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    const { data: properties, error: propsError } = await supabase.from('properties').select('id').limit(1);
    if (propsError || !properties.length) {
        console.error('Error fetching properties', propsError);
        return;
    }

    const propertyId = properties[0].id;

    const { data, error } = await supabase
        .from('cleaning_checklists')
        .insert([{
            property_id: propertyId,
            date: new Date().toISOString().split('T')[0],
            assigned_to: 'Debug Admin',
            status: 'Pending'
        }])
        .select()
        .single();

    if (error) {
        console.error('Raw Error:', JSON.stringify(error, null, 2));
        console.error('Error Object:', error);
    } else {
        console.log('Success:', data);
    }
}

testInsert();
