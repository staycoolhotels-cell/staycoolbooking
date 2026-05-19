import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    dotenv.config({ path: '.env.example' });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    const { data: users, error: err1 } = await supabase.from('users').select('*').limit(1);
    console.log('User model:', users ? Object.keys(users[0] || {}) : err1);

    const { data: props, error: err2 } = await supabase.from('properties').select('*').limit(1);
    console.log('Property model:', props ? Object.keys(props[0] || {}) : err2);

    const { data: msgs, error: err3 } = await supabase.from('messages').select('*').limit(1);
    console.log('Message model:', msgs ? Object.keys(msgs[0] || {}) : err3);
}

testFetch();
