import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * One-time fix route: Patches the auth.users UPDATE trigger so it
 * correctly handles admin-role users without throwing a DB error.
 * 
 * Call: GET /api/apply-trigger-fix
 * DELETE this route after confirming the fix works.
 */
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const sql = `
      -- 1. Drop EVERY possible conflicting trigger on auth.users
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
      DROP TRIGGER IF EXISTS on_auth_user_sync ON auth.users;

      -- 2. Drop old functions to avoid naming collisions
      DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
      DROP FUNCTION IF EXISTS public.handle_user_update() CASCADE;
      DROP FUNCTION IF EXISTS public.sync_user_profile() CASCADE;

      -- 3. Create the UNIFIED, ROBUST trigger function
      CREATE OR REPLACE FUNCTION public.handle_auth_user_sync()
      RETURNS TRIGGER AS $$
      DECLARE
        v_role TEXT;
        v_status TEXT;
        v_name TEXT;
        v_avatar TEXT;
      BEGIN
        -- Extract and sanitize data from metadata
        v_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'guest'));
        v_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.email);
        v_avatar := NEW.raw_user_meta_data->>'avatar_url';

        -- Determine the target status
        IF v_role = 'host' THEN
          v_status := COALESCE(NEW.raw_user_meta_data->>'status', 'pending');
        ELSE
          v_status := 'active';
        END IF;

        -- Perform the UPSERT into public.users
        INSERT INTO public.users (id, name, email, role, status, avatar_url)
        VALUES (
          NEW.id,
          v_name,
          NEW.email,
          v_role,
          v_status,
          v_avatar
        )
        ON CONFLICT (id) DO UPDATE SET
          name = COALESCE(EXCLUDED.name, public.users.name),
          email = EXCLUDED.email,
          role = EXCLUDED.role,
          avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
          status = CASE
            WHEN public.users.status IN ('active', 'approved', 'approved_host') THEN public.users.status
            WHEN public.users.status = 'rejected' THEN public.users.status
            WHEN public.users.status = 'suspended' THEN public.users.status
            ELSE v_status
          END;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- 4. Re-attach the trigger for BOTH Insert and Update
      CREATE TRIGGER on_auth_user_sync
      AFTER INSERT OR UPDATE ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_sync();

      -- 5. Heal existing entries
      UPDATE public.users SET status = 'active' WHERE status IN ('approved', 'approved_host', 'Approved');
    `;

  const { error } = await supabase.rpc('exec_sql', { query: sql }).single();

  // If rpc doesn't exist, try running it as a raw query via pg_catalog
  if (error && error.message?.includes('exec_sql')) {
    // exec_sql RPC doesn't exist — instruct user to run manually
    return NextResponse.json({
      success: false,
      message: 'RPC not available. Please run FIX_ADMIN_UPDATE_TRIGGER.sql manually in Supabase SQL Editor.',
      sql,
    }, { status: 400 });
  }

  if (error) {
    console.error('Trigger fix failed:', error);
    return NextResponse.json({ success: false, error: 'An unexpected error occurred.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Trigger fix applied successfully!' });
}
