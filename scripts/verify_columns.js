
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dlislsrlwovcxsuqdlvy.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzMyNjc1MywiZXhwIjoyMDgyOTAyNzUzfQ.UfXHBCd8FjoXMktEvJjFF37B1xEY2xA99oAGLN03E1Q';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function check() {
    const { data, error } = await supabase.from('users').select('*').limit(1);
    if (data && data.length > 0) {
        console.log('User Columns:', Object.keys(data[0]));
        if (!data[0].hasOwnProperty('stripe_account_id')) {
            console.error('MISSING: stripe_account_id');
        } else {
            console.log('FOUND: stripe_account_id');
        }
    } else {
        console.log('No users to check.');
    }
}

check();
