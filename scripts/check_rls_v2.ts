
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlislsrlwovcxsuqdlvy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMjY3NTMsImV4cCI6MjA4MjkwMjc1M30.H4049rHx_Ur1b_xxl9swVrdBN0G5aEQVvRNPzdqus4w';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzMyNjc1MywiZXhwIjoyMDgyOTAyNzUzfQ.UfXHBCd8FjoXMktEvJjFF37B1xEY2xA99oAGLN03E1Q';

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log('--- CHECKING AS ADMIN (Service Role) ---');
    const { data: allProps, error: allError } = await adminClient
        .from('properties')
        .select('id, title, status, tier');

    if (allError) {
        console.error('Admin Error:', allError.message);
    } else {
        console.log(`Total properties in DB: ${allProps?.length || 0}`);
        console.table(allProps);
    }

    console.log('\n--- CHECKING AS ANONYMOUS USER ---');
    const { data: activeProps, error: activeError } = await anonClient
        .from('properties')
        .select('id, title, status')
        .eq('status', 'active');

    if (activeError) {
        console.error('Anon Error:', activeError.message);
    } else {
        console.log(`Visible Active Properties: ${activeProps?.length || 0}`);
        console.table(activeProps);
    }
}

check();
