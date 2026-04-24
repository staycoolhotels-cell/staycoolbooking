
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dlislsrlwovcxsuqdlvy.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzMyNjc1MywiZXhwIjoyMDgyOTAyNzUzfQ.UfXHBCd8FjoXMktEvJjFF37B1xEY2xA99oAGLN03E1Q';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
    console.log('Starting Final Fix...');

    // 1. Create User
    const email = `final_host_${Date.now()}@test.com`;
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: 'Password123!',
        email_confirm: true,
        user_metadata: { name: 'Final Host', role: 'host' }
    });

    if (createError) { console.error(createError); return; }
    console.log('User Created:', user.id);

    // 2. Upsert Public User explicitly
    await supabase.from('users').upsert({
        id: user.id,
        email: email,
        name: 'Final Host',
        role: 'host',
        status: 'approved',
        stripe_account_id: 'acct_123456789',
        stripe_onboarding_completed: true
    });
    console.log('User Upserted.');

    // 3. Insert Property using KNOWN GOOD structure
    const { data, error } = await supabase.from('properties').insert({
        title: 'Final Test Property',
        location: 'Final City',
        tier: 'Standard',
        status: 'active',
        host_id: user.id,
        price_per_night: 500,
        description: 'Final test property.',
        max_guests: 4
    }).select();

    if (error) {
        console.error('Property Create Error:', JSON.stringify(error, null, 2));
    } else {
        console.log('Property Created Success:', data[0].id);
    }
}

run();
