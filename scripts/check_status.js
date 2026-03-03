
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dlislsrlwovcxsuqdlvy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMjY3NTMsImV4cCI6MjA4MjkwMjc1M30.H4049rHx_Ur1b_xxl9swVrdBN0G5aEQVvRNPzdqus4w';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzMyNjc1MywiZXhwIjoyMDgyOTAyNzUzfQ.UfXHBCd8FjoXMktEvJjFF37B1xEY2xA99oAGLN03E1Q';

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    try {
        console.log('--- ADMIN CHECK ---');
        const { data: adminData } = await adminClient.from('properties').select('id, status, title');
        console.log('Admin sees:', adminData);

        console.log('\n--- ANON CHECK ---');
        const { data: anonData, error } = await anonClient.from('properties').select('id, status, title');

        if (error) {
            console.log('ANON ERROR:', error.message);
        } else {
            console.log('Anon sees:', anonData);
        }
    } catch (err) {
        console.log('EXCEPTION:', err.message);
    }
}

check();
