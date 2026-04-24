

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dlislsrlwovcxsuqdlvy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzMyNjc1MywiZXhwIjoyMDgyOTAyNzUzfQ.UfXHBCd8FjoXMktEvJjFF37B1xEY2xA99oAGLN03E1Q';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function runMigration() {
    console.log('Running wishlist board migration...');

    const { data, error } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE public.wishlist ADD COLUMN IF NOT EXISTS board TEXT DEFAULT NULL;`
    });

    if (error) {
        console.log('exec_sql RPC not found, trying raw query via pg...');
        console.error('Error:', error.message);
        console.log('\n=== MANUAL STEP REQUIRED ===');
        console.log('Please run this SQL in your Supabase dashboard (SQL Editor):');
        console.log('');
        console.log('ALTER TABLE public.wishlist ADD COLUMN IF NOT EXISTS board TEXT DEFAULT NULL;');
        console.log('');
        return;
    }

    console.log('✅ Migration successful!', data);
}

runMigration();
