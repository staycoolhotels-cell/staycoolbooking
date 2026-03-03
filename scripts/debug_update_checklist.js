const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdateStatus() {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
    });

    if (authError) {
        console.error('Admin login failed', authError);
        return;
    }

    const { data: checklist, error: fetchError } = await supabase
        .from('cleaning_checklists')
        .select('id, status')
        .limit(1)
        .single();

    if (fetchError) {
        console.log('Error fetching checklist:', fetchError);
        return;
    }

    console.log('Found checklist:', checklist);

    const { data, error } = await supabase
        .from('cleaning_checklists')
        .update({ status: 'Completed' })
        .eq('id', checklist.id)
        .select();

    if (error) {
        console.error('Raw Error:', JSON.stringify(error, null, 2));
    } else {
        console.log('Update success:', data);
    }
}

testUpdateStatus();
