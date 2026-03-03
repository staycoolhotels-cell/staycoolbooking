import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
);

async function checkRLSWithPostgres() {
    // Check if the policy was actually applied
    const { data: policies, error: polErr } = await supabase.from('wishlist').select('*').limit(1);

    // To truly check if RLS is the issue, we can check pg_policies via RPC but we don't have that.
    // Let's check how many rows are in the wishlist table currently using Service Role
    const { data: wishlistItems, error: itemsErr } = await supabase.from('wishlist').select('*');

    fs.writeFileSync('wishlist_status.json', JSON.stringify({
        totalItems: wishlistItems?.length,
        items: wishlistItems,
        error: itemsErr
    }, null, 2));
}

checkRLSWithPostgres();
