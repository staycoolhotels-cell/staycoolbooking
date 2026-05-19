import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlislsrlwovcxsuqdlvy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzMyNjc1MywiZXhwIjoyMDgyOTAyNzUzfQ.UfXHBCd8FjoXMktEvJjFF37B1xEY2xA99oAGLN03E1Q';

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function test() {
    const { data: propData } = await adminClient.from('properties').select('id, title, host_id').limit(1);
    if (!propData || propData.length === 0) return console.log('No properties to test');

    console.log('Using property:', propData[0].id);

    const { data, error } = await adminClient
        .from('cleaning_checklists')
        .insert([{
            property_id: propData[0].id,
            date: '2026-02-27',
            assigned_to: 'Test User',
            status: 'Pending'
        }])
        .select()
        .single();

    console.log('Insert Table check Result:', data);
    console.log('Error check:', error);
}

test();
