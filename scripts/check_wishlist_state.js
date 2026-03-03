import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
);

async function checkWishlistData() {
    console.log("Checking wishlist table...");
    const { data: allItems, error: itemsErr } = await supabase.from('wishlist').select('*').limit(10);

    fs.writeFileSync('wishlist_data.json', JSON.stringify({ items: allItems, error: itemsErr }, null, 2));

    console.log("Data written to wishlist_data.json");
}

checkWishlistData();
