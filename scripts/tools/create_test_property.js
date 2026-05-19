
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://dlislsrlwovcxsuqdlvy.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzMyNjc1MywiZXhwIjoyMDgyOTAyNzUzfQ.UfXHBCd8FjoXMktEvJjFF37B1xEY2xA99oAGLN03E1Q';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createProperty() {
    console.log('Creating Test Property...');

    // 1. Find a valid Host
    const { data: hosts } = await supabase.from('users').select('id').eq('role', 'host').limit(1);

    if (!hosts || hosts.length === 0) {
        console.error('No hosts found! Cannot create property.');
        return;
    }

    const hostId = hosts[0].id;
    console.log('Using Host ID:', hostId);

    // 2. Create Property
    const { data, error } = await supabase.from('properties').insert({
        title: 'Test Property for Payment Verification',
        location: 'Test City, TS',
        tier: 'Standard',
        status: 'active',
        host_id: hostId,
        price_per_night: 500,
        description: 'A test property created automatically to verify payments.',
        max_guests: 4
    }).select();

    if (error) {
        console.error('Error creating property:', error);
    } else {
        console.log('Created Property:', data[0]);
    }
}

createProperty();
