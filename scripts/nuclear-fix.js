
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://dlislsrlwovcxsuqdlvy.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzMyNjc1MywiZXhwIjoyMDgyOTAyNzUzfQ.UfXHBCd8FjoXMktEvJjFF37B1xEY2xA99oAGLN03E1Q';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function nuclearFix() {
    console.log('Starting Nuclear Fix...');
    try {
        // 1. Create a GUARANTEED valid user in Auth
        const email = `system_host_${Date.now()}@staycool.com`;
        const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
            email: email,
            password: 'Password123!',
            email_confirm: true,
            user_metadata: { name: 'System Host', role: 'host' }
        });

        if (createError || !user) {
            console.error('Failed to create system user:', createError);
            return;
        }

        console.log('Created System User:', user.id);

        // 2. Wait a moment for triggers to populate public.users (if any)
        const { error: upsertError } = await supabase.from('users').upsert({
            id: user.id,
            email: email,
            name: 'System Host',
            role: 'host',
            status: 'approved',
            stripe_onboarding_completed: true,
            stripe_account_id: 'acct_123456789'
        });

        if (upsertError) console.error('Upsert error:', upsertError);

        // 3. Reassign properties
        const badId = '38ac5294-564b-45ba-ab18-035f59c30e19';
        console.log('Reassigning from', badId, 'to', user.id);

        const { data, error } = await supabase
            .from('properties')
            .update({ host_id: user.id })
            .eq('host_id', badId)
            .select();

        if (error) {
            console.error('Update failed:', error);
        } else {
            console.log(`SUCCESS: Fixed ${data.length} orphaned properties.`);
        }

    } catch (e) {
        console.error('Unexpected error:', e);
    }
}

nuclearFix();
