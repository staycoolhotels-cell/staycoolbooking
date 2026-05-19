-- ============================================================
-- ENFORCE KYC ACTIVATION FOR PROPERTY TOGGLE LIVE
-- ============================================================

CREATE OR REPLACE FUNCTION public.toggle_property_status(p_id UUID, p_status TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status TEXT;
  v_host_id UUID;
  v_kyc_status TEXT;
BEGIN
  -- Get current status and host
  SELECT status, host_id INTO v_current_status, v_host_id
  FROM public.properties
  WHERE id = p_id;

  -- Verify ownership
  IF v_host_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- If transition is to 'active' (making it live), verify that KYC setup is completed and status is 'activated'
  IF p_status = 'active' THEN
    SELECT kyc_status INTO v_kyc_status
    FROM public.host_kyc_details
    WHERE user_id = v_host_id;

    IF v_kyc_status IS NULL OR v_kyc_status != 'activated' THEN
      RAISE EXCEPTION 'Banking & KYC setup must be Active & Verified before taking a property live. Current KYC status: %', COALESCE(v_kyc_status, 'pending');
    END IF;
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

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.toggle_property_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_property_status(UUID, TEXT) TO service_role;
