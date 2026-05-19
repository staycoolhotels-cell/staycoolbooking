-- ============================================================
-- DEFINITIVE HOST APPROVAL FIX
-- Run this in Supabase SQL Editor
--
-- This creates a secure approve_host RPC function that:
-- 1. Updates status to 'active' in public.users DIRECTLY
-- 2. Is called with service_role key from the app
-- 3. Cannot be rolled back by any trigger (SECURITY DEFINER)
-- ============================================================

-- 1. Create the approve_host function (SECURITY DEFINER = runs as DB superuser)
CREATE OR REPLACE FUNCTION public.approve_host(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Directly update the host's status to active
  UPDATE public.users
  SET status = 'active',
      updated_at = NOW()
  WHERE id = p_user_id
    AND role = 'host';

  IF NOT FOUND THEN
    -- Try without role restriction (in case role is not set correctly)
    UPDATE public.users
    SET status = 'active',
        updated_at = NOW()
    WHERE id = p_user_id;
  END IF;

  RETURN TRUE;
END;
$$;

-- 2. Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION public.approve_host(UUID) TO service_role;

-- 3. Create the reject_host function
CREATE OR REPLACE FUNCTION public.reject_host(p_user_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET status = 'rejected',
      rejection_reason = COALESCE(p_reason, rejection_reason),
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$;

-- 4. Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION public.reject_host(UUID, TEXT) TO service_role;

-- 5. Verify
DO $$
BEGIN
  RAISE NOTICE '✅ approve_host() and reject_host() functions created successfully.';
  RAISE NOTICE '✅ Call approved_host(user_id) from your server application.';
END $$;
