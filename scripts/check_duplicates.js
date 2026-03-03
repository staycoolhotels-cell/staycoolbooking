import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
);

async function checkDuplicates() {
    console.log("Checking wishlist items...");

    const { data: wishlistItems, error: itemsErr } = await supabase.from('wishlist').select('*');

    if (itemsErr) {
        console.error("Error:", itemsErr);
        return;
    }

    const duplicates = {};
    const toDelete = [];

    for (const item of wishlistItems) {
        const key = `${item.user_id}_${item.property_id}`;
        if (!duplicates[key]) {
            duplicates[key] = true;
        } else {
            console.log("Found duplicate:", item.id);
            toDelete.push(item.id);
        }
    }

    if (toDelete.length > 0) {
        console.log("We have duplicates! Count:", toDelete.length);
        fs.writeFileSync('duplicates.json', JSON.stringify({ toDelete }, null, 2));
    } else {
        console.log("No duplicates found. Total rows:", wishlistItems.length);
    }
}

checkDuplicates();
