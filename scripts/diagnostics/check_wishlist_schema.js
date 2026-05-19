import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
    const { data, error } = await supabase.from('wishlist').select('*').limit(1);
    console.log("Wishlist data sample:", JSON.stringify(data, null, 2));
    console.log("Error:", JSON.stringify(error, null, 2));
}

checkSchema();
