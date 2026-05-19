const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testFetchAdmin() {
    const { data, error } = await supabase.from('users').select('id, name').eq('role', 'admin').limit(1).single();
    if (error) {
        console.error('Error fetching admin (Anon Key):', error);
    } else {
        console.log('Admin found (Anon Key):', data);
    }
}

testFetchAdmin();
