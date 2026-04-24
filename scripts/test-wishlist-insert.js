import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
);

async function testWishlist() {
    console.log("Testing wishlist schema...");
    const { data: cols, error: colsErr } = await supabase.rpc('execute_sql', {
        sql_string: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'wishlist';`
    });

    console.log("Columns Data:", cols);
    console.log("Columns Error:", colsErr);

    const { error: insertErr } = await supabase.from('wishlist').insert([{
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        property_id: '5d1e8b1a-7bff-45df-8f5b-1234567890ab'
    }]);
    console.log("Insert Error:", insertErr);
}
testWishlist();
