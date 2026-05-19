const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testHostInsert() {

    const { data: properties, error: propsError } = await supabase.from('properties').select('id, host_id').limit(1);
    if (propsError || !properties.length) {
        console.error('Error fetching properties', propsError);
        return;
    }

    const property = properties[0];
    console.log('Testing with property:', property.id, 'Host ID:', property.host_id);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
    });

    if (authError) {
        console.error('Admin login failed', authError);
        return;
    }

    const { data, error } = await supabase
        .from('cleaning_checklists')
        .insert([{
            property_id: property.id,
            date: new Date().toISOString().split('T')[0],
            assigned_to: 'Debug Admin (Testing Admin Policy)',
            status: 'Pending'
        }])
        .select()
        .single();

    if (error) {
        console.error('Raw Error:', JSON.stringify(error, null, 2));
        console.error('Error Object:', error);
    } else {
        console.log('Success inserting as admin:', data);
    }
}

testHostInsert();
