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

    } else {
        console.log("Success adding board column via RPC");
    }
}

addBoardColumn();
