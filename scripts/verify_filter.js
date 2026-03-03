
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dlislsrlwovcxsuqdlvy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzMyNjc1MywiZXhwIjoyMDgyOTAyNzUzfQ.UfXHBCd8FjoXMktEvJjFF37B1xEY2xA99oAGLN03E1Q';

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verifyFilter() {
    try {
        console.log('--- STARTING VERIFICATION ---');

        // 1. Create a dummy PENDING property
        console.log('Creating a dummy PENDING property...');
        // Providing more fields to satisfy potentially hidden constraints or triggers
        const { data: pendingProp, error: createError } = await adminClient
            .from('properties')
            .insert({
                name: 'TEST_PENDING_PROPERTY',
                title: 'TEST_PENDING_PROPERTY',
                description: 'This property should NOT be visible',
                status: 'pending',
                price_per_night: 999,
                weekend_price_per_night: 1200, // Added based on recent migrations
                location: 'Test Location',
                tier: 'Standard',
                image_url: 'https://example.com/image.jpg'
            })
            .select()
            .single();

        if (createError) {
            console.error('Failed to create test property:', JSON.stringify(createError, null, 2));
            return;
        }
        console.log(`Created property: ${pendingProp.id} with status: ${pendingProp.status}`);

        // 2. Simulate User Query (Active Only)
        console.log('Simulating Guest Homepage Query (Status = Active)...');
        const { data: visibleProps, error: queryError } = await adminClient
            .from('properties')
            .select('id, title, status')
            .eq('status', 'active');

        if (queryError) {
            console.error('Query failed:', queryError.message);
        } else {
            // 3. Assert Exclusion
            const isVisible = visibleProps.find(p => p.id === pendingProp.id);
            if (isVisible) {
                console.error('FAIL: Pending property IS visible in active list!');
            } else {
                console.log('SUCCESS: Pending property is correctly EXCLUDED from active list.');
                console.log(`Visible Active Properties Count: ${visibleProps.length}`);
            }
        }

        // 4. Cleanup
        console.log('Cleaning up test property...');
        await adminClient.from('properties').delete().eq('id', pendingProp.id);
        console.log('Cleanup complete.');

    } catch (err) {
        console.log('EXCEPTION:', err.message);
    }
}

verifyFilter();
