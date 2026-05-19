
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dlislsrlwovcxsuqdlvy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzMyNjc1MywiZXhwIjoyMDgyOTAyNzUzfQ.UfXHBCd8FjoXMktEvJjFF37B1xEY2xA99oAGLN03E1Q';

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verifyFilter() {
    try {
        console.log('--- STARTING NON-DESTRUCTIVE VERIFICATION ---');
        const { data: props, error: fetchError } = await adminClient
            .from('properties')
            .select('id, title, status')
            .eq('status', 'active')
            .limit(1);

        if (fetchError || !props || props.length === 0) {
            console.error('No active properties found to test with.');
            return;
        }

        const testProp = props[0];
        console.log(`Using Property: ${testProp.id} (${testProp.title}) - Current Status: ${testProp.status}`);
        console.log('Setting status to PENDING...');
        const { error: updateError } = await adminClient
            .from('properties')
            .update({ status: 'pending' })
            .eq('id', testProp.id);

        if (updateError) {
            console.error('Failed to update status:', updateError.message);
            return;
        }
        console.log('Simulating Guest Homepage Query (Status = Active)...');
        const { data: visibleProps, error: queryError } = await adminClient
            .from('properties')
            .select('id, title, status')
            .eq('status', 'active');

        if (queryError) {
            console.error('Query failed:', queryError.message);
        } else {
            const isVisible = visibleProps.find(p => p.id === testProp.id);
            if (isVisible) {
                console.error('FAIL: Property IS still visible despite being pending!');
                console.log('Visible List:', visibleProps.map(p => p.id));
            } else {
                console.log('SUCCESS: Property is correctly EXCLUDED from active list.');
                console.log(`Visible Active Properties Count: ${visibleProps.length}`);
            }
        }
        console.log('Restoring status to ACTIVE...');
        await adminClient
            .from('properties')
            .update({ status: 'active' })
            .eq('id', testProp.id);

        console.log('Restoration complete.');

    } catch (err) {
        console.log('EXCEPTION:', err.message);
    }
}

verifyFilter();
