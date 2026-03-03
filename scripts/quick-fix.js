
const { createClient } = require('@supabase/supabase-js');

// Hardcoded for immediate execution stability
const supabaseUrl = 'https://dlislsrlwovcxsuqdlvy.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzMyNjc1MywiZXhwIjoyMDgyOTAyNzUzfQ.UfXHBCd8FjoXMktEvJjFF37B1xEY2xA99oAGLN03E1Q';
const adminEmail = 'admin@staycool.com';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fix() {
    console.log('Starting Fix...');
    try {
        // 1. Find Admin
        const { data: users, error } = await supabase
            .from('users')
            .select('id, email, role')
            .eq('email', adminEmail);

        if (error || !users || users.length === 0) {
            console.error('Admin not found. Looking for any host...');
            const { data: hosts } = await supabase.from('users').select('id').eq('role', 'host').limit(1);
            if (hosts && hosts.length > 0) {
                await reassign(hosts[0].id);
            } else {
                console.error('No hosts found.');
            }
            return;
        }

        const admin = users[0];
        console.log('Found Admin:', admin.id);

        if (admin.role !== 'host') {
            console.log('Promoting to host...');
            await supabase.from('users').update({ role: 'host' }).eq('id', admin.id);
        }

        await reassign(admin.id);
    } catch (e) {
        console.error('Unexpected error:', e);
    }
}

async function reassign(hostId) {
    const badId = '38ac5294-564b-45ba-ab18-035f59c30e19';
    console.log('Reassigning properties from', badId, 'to', hostId);
    const { data, error } = await supabase
        .from('properties')
        .update({ host_id: hostId })
        .eq('host_id', badId)
        .select();

    if (error) console.error(error);
    else console.log('Fixed', data.length, 'properties.');
}

fix();
