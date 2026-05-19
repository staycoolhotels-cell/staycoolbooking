import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testWishlist() {
    const { data: users } = await supabase.from('users').select('id').limit(1);
    const { data: props } = await supabase.from('properties').select('id').limit(1);

    if (!users?.length || !props?.length) {
        console.log("No users or properties to test with");
        return;
    }

    const userId = users[0].id;
    const propId = props[0].id;

    console.log(`Testing insert for User: ${userId}, Property: ${propId}`);

    const { data, error } = await supabase
        .from('wishlist')
        .insert([
            {
                user_id: userId,
                property_id: propId,
                board: 'Test Board'
            }
        ])
        .select();

    console.log("Insert Result:", { data, error });

    if (data) {
        await supabase.from('wishlist').delete().eq('id', data[0].id);
        console.log("Cleaned up");
    }
}

testWishlist();
