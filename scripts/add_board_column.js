import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addBoardColumn() {
    const { data, error } = await supabase.rpc('execute_sql', {
        sql_string: `ALTER TABLE public.wishlist ADD COLUMN IF NOT EXISTS board TEXT DEFAULT 'All';`
    });

    if (error) {
        console.error("RPC failed, trying raw postgrest", error);
        // If rpc fails, we can't easily execute DDL from js client unless we have a specific RPC setup. 
        // We will assume it might fail if execute_sql doesn't exist.
    } else {
        console.log("Success adding board column via RPC");
    }
}

addBoardColumn();
