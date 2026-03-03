-- FIXED MIGRATION SCRIPT FOR LIVE/OFFLINE TOGGLE
-- Run this entire script in Supabase SQL Editor

-- 1. CLEANUP: Drop existing function and constraint if they exist
DROP FUNCTION IF EXISTS public.toggle_property_status(UUID, TEXT);
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_status_check;

-- 2. CONSTRAINT: allow 'offline' status
ALTER TABLE public.properties ADD CONSTRAINT properties_status_check
  CHECK (status IN ('pending', 'active', 'rejected', 'offline'));

-- 3. FUNCTION: create the secure toggle function
CREATE OR REPLACE FUNCTION toggle_property_status(p_id UUID, p_status TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status TEXT;
  v_host_id UUID;
BEGIN
  -- Get current status and host
  SELECT status, host_id INTO v_current_status, v_host_id
  FROM public.properties
  WHERE id = p_id;

  -- Verify ownership
  IF v_host_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Logic
  IF p_status = 'offline' THEN
    -- Can take active to offline
    IF v_current_status = 'active' THEN
      UPDATE public.properties SET status = 'offline' WHERE id = p_id;
    ELSIF v_current_status = 'offline' THEN
      -- Already offline, do nothing
      RETURN;
    ELSE
      RAISE EXCEPTION 'Only active properties can be taken offline. Current status: %', v_current_status;
    END IF;
  ELSIF p_status = 'active' THEN
    -- Can take offline to active
    IF v_current_status = 'offline' THEN
      UPDATE public.properties SET status = 'active' WHERE id = p_id;
    ELSIF v_current_status = 'active' THEN
      -- Already active, do nothing
      RETURN;
    ELSE
      RAISE EXCEPTION 'Only offline properties can be reactivated directly. Pending properties must be approved by admin. Current status: %', v_current_status;
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid status transition to %', p_status;
  END IF;
END;
$$;

-- 4. PERMISSIONS: Grant execute permission
GRANT EXECUTE ON FUNCTION toggle_property_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_property_status(UUID, TEXT) TO service_role;
