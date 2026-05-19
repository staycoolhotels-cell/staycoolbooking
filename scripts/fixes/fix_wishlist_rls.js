import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
);

async function run() {
    console.log("Applying RLS policies to wishlist...");
    const sql = `
        ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view their own wishlist" ON public.wishlist;
        DROP POLICY IF EXISTS "Users can insert their own wishlist" ON public.wishlist;
        DROP POLICY IF EXISTS "Users can update their own wishlist" ON public.wishlist;
        DROP POLICY IF EXISTS "Users can delete their own wishlist" ON public.wishlist;
        
        CREATE POLICY "Users can view their own wishlist" ON public.wishlist FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert their own wishlist" ON public.wishlist FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update their own wishlist" ON public.wishlist FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can delete their own wishlist" ON public.wishlist FOR DELETE USING (auth.uid() = user_id);
    `;
    const { data, error } = await supabase.rpc('execute_sql', { sql_string: sql });
    console.log("Result via RPC:", { data, error });
}

run();
