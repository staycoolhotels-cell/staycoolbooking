import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
);

async function testInsert() {
    const { data: users } = await supabase.from('users').select('id').limit(1);
    const { data: props } = await supabase.from('properties').select('id').limit(1);

    if (users.length && props.length) {
        const { error } = await supabase.from('wishlist').insert([
            {
                user_id: users[0].id,
                property_id: props[0].id,
                board: 'All'
            }
        ]);
        console.log("Insert with board:", error);
    }
}

testInsert();
