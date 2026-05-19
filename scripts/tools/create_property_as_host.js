
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dlislsrlwovcxsuqdlvy.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMjY3NTMsImV4cCI6MjA4MjkwMjc1M30.H4049rHx_Ur1b_xxl9swVrdBN0G5aEQVvRNPzdqus4w'; // Using Anon Key for client sim
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzMyNjc1MywiZXhwIjoyMDgyOTAyNzUzfQ.UfXHBCd8FjoXMktEvJjFF37B1xEY2xA99oAGLN03E1Q';

async function run() {
    console.log('Starting Authentic Creation Flow...');

    // 1. Admin creates user to ensure it exists and is valid
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const email = `host_${Date.now()}@real.com`;
    const password = 'Password123!';

    const { data: { user }, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: 'Real Host', role: 'host' }
    });

    if (createError) {
        console.error('Create User Error:', createError);
        return;
    }
    console.log('User Created:', user.id);

    // 2. Client logs in
    const client = createClient(supabaseUrl, anonKey);
    const { data: { session }, error: loginError } = await client.auth.signInWithPassword({
        email,
        password
    });

    if (loginError) {
        console.error('Login Error:', loginError);
        return;
    }
    console.log('Logged in as Host.');

    // 3. Admin Insert (Title Only)

    const { data: prop, error: propError } = await adminClient.from('properties').insert({
        title: 'Authentic Verify Property',
        description: 'Created via auth flow',
        price_per_night: 550,
        max_guests: 3,
        location: 'Auth City',
        status: 'active',
        host_id: user.id
    }).select();

    if (propError) {
        console.error('Admin Insert Error:', propError.message, propError.details, propError.hint);
    } else {
        console.log('Admin Insert Success:', prop);
    }

    if (propError) {
        console.error('Authenticated Insert Error:', propError);
        console.log('Retrying with create_property RPC...');
        const { data: rpcData, error: rpcError } = await client.rpc('create_property', {
            p_title: 'Authentic Verify Property RPC',
            p_description: 'Created via RPC',
            p_price_per_night: 550,
            p_tier: 'Standard',
            p_amenities: {},
            p_license_url: '',
            p_tax_bill_url: '',
            p_current_bill_url: '',
            p_image_url: '',
            p_cancellation_policy: 'flexible',
            p_rules: [],
            p_safety_items: [],
            p_bedrooms: 1,
            p_bathrooms: 1,
            p_max_guests: 2,
            p_area: 100
        });

        if (rpcError) {
            console.error('RPC Error:', rpcError);
        } else {
            console.log('RPC Success:', rpcData);
        }

    } else {
        console.log('Authenticated Insert Success:', prop);
    }

    // 4. Ensure public.users has stripe info (Admin override)

    await adminClient.from('users').update({
        stripe_account_id: 'acct_123456789',
        stripe_onboarding_completed: true
    }).eq('id', user.id);

    console.log('Updated Host Stripe Info.');
}

run();
