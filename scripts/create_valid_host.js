
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dlislsrlwovcxsuqdlvy.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzMyNjc1MywiZXhwIjoyMDgyOTAyNzUzfQ.UfXHBCd8FjoXMktEvJjFF37B1xEY2xA99oAGLN03E1Q';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fix() {
    console.log('Creating GUARANTEED Valid Host...');

    // 1. Create User in Auth
    const email = `verified_host_${Date.now()}@staycool.com`;
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: 'Password123!',
        email_confirm: true,
        user_metadata: { name: 'Verified Host', role: 'host' }
    });

    if (createError || !user) {
        console.error('Failed to create auth user:', createError);
        return;
    }
    console.log('Created Auth User:', user.id);

    // 2. Ensure User in Public Schema (Upsert)
    const { error: upsertError } = await supabase.from('users').upsert({
        id: user.id,
        email: email,
        name: 'Verified Host',
        role: 'host',
        status: 'approved',
        stripe_account_id: 'acct_123456789',
        stripe_onboarding_completed: true
    });

    if (upsertError) console.error('Upsert Public User failed:', upsertError);
    else console.log('Upserted Public User:', user.id);

    // VERIFY EXISTENCE
    const { data: verifyUser, error: verifyError } = await supabase.from('users').select('*').eq('id', user.id).single();
    if (verifyError || !verifyUser) {
        console.error('CRITICAL: User not found in public.users after upsert!', verifyError);
        return;
    }
    console.log('Verified User in DB:', verifyUser.id, verifyUser.role);

    // 3. Find the "Test Property" and Update Host
    const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .ilike('title', '%Test Property for Payment Verification%');

    if (!properties || properties.length === 0) {
        console.error('Could not find the Test Property to fix.');
        return;
    }

    const propId = properties[0].id;
    console.log('Updating Property', propId, 'to Host', user.id);

    const { error: updateError } = await supabase
        .from('properties')
        .update({ host_id: user.id })
        .eq('id', propId);

    if (updateError) console.error('Property update failed:', updateError);
    else console.log('SUCCESS: Property reassigned to valid host.');
}

fix();
