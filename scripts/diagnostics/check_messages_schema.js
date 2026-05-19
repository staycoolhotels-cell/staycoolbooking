const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkSchema() {
    const { data, error } = await supabase.from('messages').select('*').limit(1);
    if (error) {
        console.error('Error fetching messages:', error);
    } else {
        console.log('Columns in messages table:', Object.keys(data[0] || {}));
    }
}

checkSchema();
