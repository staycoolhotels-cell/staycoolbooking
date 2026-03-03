import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
);

async function run() {
    console.log("Fixing wishlist foreign key constraint...");
    const sql = `
        ALTER TABLE public.wishlist DROP CONSTRAINT IF EXISTS wishlist_user_id_fkey;
        ALTER TABLE public.wishlist DROP CONSTRAINT IF EXISTS wishlist_user_id_fkey1;
        ALTER TABLE public.wishlist ADD CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    `;
    const { data, error } = await supabase.rpc('execute_sql', { sql_string: sql });
    console.log("Result:", { data, error });
}

run();
