const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkAdmin() {
    const { data, error } = await supabase.from('users').select('id, name, role').eq('role', 'admin');
    if (error) {
        console.error('Error fetching admin:', error);
    } else {
        console.log('Admin users:', data);
    }
}

checkAdmin();
