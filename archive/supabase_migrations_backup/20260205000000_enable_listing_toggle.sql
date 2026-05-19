-- 1. Update Constraint to allow 'offline' status
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_status_check;
ALTER TABLE public.properties ADD CONSTRAINT properties_status_check
  CHECK (status IN ('pending', 'active', 'rejected', 'offline'));

-- 2. Create Function for safely toggling status
-- This function allows hosts to toggle between 'active' and 'offline'
-- ensuring they cannot self-approve 'pending' or 'rejected' properties.
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
    -- Also allow taking pending to offline? Maybe not needed for now based on req.
    -- Assuming strictly Active <-> Offline toggle for "Live" button.
    ELSE
      RAISE EXCEPTION 'Only active properties can be taken offline. Current status: %', v_current_status;
    END IF;
  ELSIF p_status = 'active' THEN
    -- Can take offline to active
    IF v_current_status = 'offline' THEN
      UPDATE public.properties SET status = 'active' WHERE id = p_id;
    ELSE
      RAISE EXCEPTION 'Only offline properties can be reactivated. Pending properties must be approved by admin. Current status: %', v_current_status;
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid status transition to %', p_status;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION toggle_property_status(UUID, TEXT) TO authenticated;
