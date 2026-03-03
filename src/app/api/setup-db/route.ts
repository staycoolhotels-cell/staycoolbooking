import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This is a one-time setup endpoint to create the missing DB function.
// DELETE this file after using it once.
export async function GET() {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    // We can use rpc to call a function that executes SQL if pg_catalog functions are accessible,
    // or we can call pg_query via Supabase's /pg endpoint.
    // Instead, let's use the Supabase Management API with a service-role-based approach.

    // Since we can't execute raw DDL through supabase-js client directly (only through postgres driver),
    // we'll use the Supabase /pg endpoint if available, or create the function
    // by using the supabase edge function invoke.

    // The cleanest approach for creating functions: use a helper function that already exists.
    // Let's check if we can use pg_catalog.pg_proc to verify function exists.
    const { data: currentFunctions, error: checkError } = await supabaseAdmin
        .from('pg_catalog.pg_proc')
        .select('proname')
        .eq('proname', 'create_bulk_booking')
        .limit(5);

    return NextResponse.json({
        message: 'Check result',
        functions: currentFunctions,
        error: checkError?.message
    });
}
