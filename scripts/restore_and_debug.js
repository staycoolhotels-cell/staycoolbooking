
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dlislsrlwovcxsuqdlvy.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzMyNjc1MywiZXhwIjoyMDgyOTAyNzUzfQ.UfXHBCd8FjoXMktEvJjFF37B1xEY2xA99oAGLN03E1Q';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
    console.log('Restoring Test Property for Bad Host...');
    const hostId = '38ac5294-564b-45ba-ab18-035f59c30e19';

    const { data, error } = await supabase.from('properties').insert({
        title: 'Restored Test Property',
        location: 'Test City',
        tier: 'Standard',
        status: 'active',
        host_id: hostId,
        price_per_night: 500,
        description: 'Restored property.',
        max_guests: 4
    }).select();

    if (error) {
        console.error('Create Error:', JSON.stringify(error, null, 2));
    } else {
        console.log('Success. Property ID:', data[0].id);
        console.log('Debugging API Fetch for Host:', hostId);
        const { data: host, error: hostError } = await supabase
            .from('users')
            .select('id, stripe_account_id, stripe_onboarding_completed')
            .eq('id', hostId)
        if (hostError) {
            console.error('Fetch Error:', hostError);
        } else {
            console.log('Fetch Result:', host);
        }
    }
}

run();
