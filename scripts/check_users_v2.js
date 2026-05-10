const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUsers() {
    const { data, error, count } = await supabase.from('users').select('*', { count: 'exact' });
    if (error) {
        console.error('Error fetching users:', error);
    } else {
        console.log('Total users count:', count);
        console.log('Users:', data);
    }
}

checkUsers();
