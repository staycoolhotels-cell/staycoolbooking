import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
);

async function checkRecentWishlistItems() {
    const { data: allItems, error: itemsErr } = await supabase
        .from('wishlist')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    fs.writeFileSync('recent_wishlist.json', JSON.stringify({ items: allItems }, null, 2));
    console.log("Written recent_wishlist.json");
}

checkRecentWishlistItems();
