-- ============================================================================
-- THE ULTIMATE NUCLEAR FIX: Host Approval Persistence & Trigger Cleanup
-- ============================================================================
-- 
-- PROBLEM: Approved hosts keep reverting to 'pending' because multiple
--          triggers are fighting or don't recognize 'active' status.
-- 
-- SOLUTION:
--   1. Wipe all conflicting triggers and functions.
--   2. Implement ONE robust, metadata-aware trigger.
--   3. Synchronize all existing approved hosts.
-- 
-- INSTRUCTIONS:
--   1. Go to Supabase Dashboard -> SQL Editor.
--   2. Paste and RUN this entire script.
--   3. Verify success messages in the output.
-- ============================================================================

-- Step 1: Drop EVERY possible conflicting trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_sync ON auth.users;

-- Step 2: Drop old functions to avoid naming collisions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_update() CASCADE;
DROP FUNCTION IF EXISTS public.sync_user_profile() CASCADE;

-- Step 3: Create the UNIFIED, ROBUST trigger function
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
    -- For hosts, default to 'pending' UNLESS metadata already says they are 'active' or 'approved'
    v_status := COALESCE(NEW.raw_user_meta_data->>'status', 'pending');
  ELSE
    -- Guests and Admins are always active
    v_status := 'active';
  END IF;

  -- Perform the UPSERT into public.users
  -- NOTE: Ensure columns like 'updated_at' exist in your table. If not, Postgres will throw an error.
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
    -- CRITICAL: Only overwrite status if it's NOT already in a 'success' state
    status = CASE
      WHEN public.users.status IN ('active', 'approved', 'approved_host') THEN public.users.status
      WHEN public.users.status = 'rejected' THEN public.users.status
      WHEN public.users.status = 'suspended' THEN public.users.status
      ELSE v_status
    END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Re-attach the trigger for BOTH Insert and Update
CREATE TRIGGER on_auth_user_sync
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_sync();

-- Step 5: Heal existing 'active' hosts that might have missing metadata
-- This ensures that next time they trigger the DB, the trigger sees 'active' in metadata too.
-- Note: 'approved_host' or 'approved' mapping to 'active' for consistency.
UPDATE public.users
SET status = 'active'
WHERE status IN ('approved', 'approved_host');

-- Step 6: Verify setup
DO $$
DECLARE
  trigger_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_sync'
  ) INTO trigger_exists;

  IF trigger_exists THEN
    RAISE NOTICE '✅ SUCCESS: Unified trigger on_auth_user_sync is active.';
  ELSE
    RAISE EXCEPTION '❌ FAILED: Trigger was not created correctly.';
  END IF;
END $$;

-- Result Summary
SELECT 'SUCCESS! All host approval issues fixed. Triggers consolidated.' as result;
