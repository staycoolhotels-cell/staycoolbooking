-- ============================================================================
-- FIX: Admin Credentials Update Trigger Bug
-- ============================================================================
-- PROBLEM:
--   When admin updates email/password via the Settings modal, Supabase's
--   admin.updateUserById call fires the on_auth_user_updated trigger.
--   The trigger tries to map role='admin' to a status, but 'admin' was only
--   handled as 'active', which can still fail if there's a status constraint.
--   Also, the trigger was not preserving admin status correctly.
--
-- SOLUTION:
--   Fix the handle_user_update trigger function to:
--   1. Skip updating public.users when role = 'admin' (preserve existing record)
--   2. Handle the 'active' case for all non-host roles including admin
-- ============================================================================

-- Drop old trigger if it exists on UPDATE events
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Fix the trigger function to handle the admin role correctly
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
  v_status text;
BEGIN
  -- Get the role from metadata
  v_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'guest'));

  -- CRITICAL: Skip updating public.users for admin accounts
  -- Admin credentials are managed separately and should not be reset by this trigger
  IF v_role = 'admin' THEN
    RETURN NEW;
  END IF;

  -- Determine status for non-admin users, respecting metadata if available
  IF v_role = 'host' THEN
    v_status := COALESCE(NEW.raw_user_meta_data->>'status', 'pending');
  ELSE
    v_status := 'active'; -- guests are auto-active
  END IF;

  -- Upsert into public.users, preserving existing status for approved/rejected/suspended users
  INSERT INTO public.users (id, name, email, avatar_url, role, status)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    v_role,
    v_status
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    avatar_url = EXCLUDED.avatar_url,
    role = v_role,
    status = CASE
      -- Preserve stateful statuses (active, approved, rejected, suspended, approved_host)
      WHEN public.users.status IN ('active', 'approved', 'rejected', 'suspended', 'approved_host') THEN public.users.status
      ELSE v_status
    END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also fix handle_new_user to handle admin role properly on INSERT
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_status TEXT;
BEGIN
  user_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'guest'));

  -- Set status based on role, respecting metadata if available
  IF user_role = 'host' THEN
    user_status := COALESCE(NEW.raw_user_meta_data->>'status', 'pending');
  ELSIF user_role = 'admin' THEN
    user_status := 'active';
  ELSE
    user_status := 'active'; -- guests
  END IF;

  INSERT INTO public.users (id, name, email, role, status, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    user_role,
    user_status,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    avatar_url = EXCLUDED.avatar_url;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the UPDATE trigger (was missing, which means updates weren't syncing)
-- This is the trigger that fires when admin.updateUserById is called
CREATE TRIGGER on_auth_user_updated
AFTER UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- Verify setup
SELECT
  trigger_name,
  event_manipulation,
  event_object_schema,
  event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
AND event_object_table = 'users'
ORDER BY event_manipulation;
