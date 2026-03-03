import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    // Using the admin client we can query pg_class through PostgREST if it's exposed, 
    // but usually pg_catalog is NOT exposed via PostgREST.
    // Let's try to query another table we can access, or just use the Supabase JS 
    // to call a function. But we don't have exec_sql.

    // An alternative way to test RLS: try to query 'wishlist' using the ANON key, and see if it returns 0 rows.
    const supabaseAnon = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
    );

    const { data: anonData, error: anonErr } = await supabaseAnon.from('wishlist').select('*').limit(5);
    const { data: adminData, error: adminErr } = await supabaseAdmin.from('wishlist').select('*').limit(5);

    return NextResponse.json({
        anonKeyResults: { data: anonData, error: anonErr, count: anonData?.length },
        adminKeyResults: { data: adminData, error: adminErr, count: adminData?.length }
    });
}
