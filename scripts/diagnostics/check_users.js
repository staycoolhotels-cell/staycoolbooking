const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkUsers() {
    const { data, error } = await supabase.from('users').select('id, name, role').limit(10);
    if (error) {
        console.error('Error fetching users:', error);
    } else {
        console.log('Users:', data);
    }
}

checkUsers();
