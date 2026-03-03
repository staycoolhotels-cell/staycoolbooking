-- Migration to update handle_user_update trigger function
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
  v_status text;
BEGIN
  -- Determine Role
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'guest');
  v_role := lower(v_role);

  -- Determine Status based on Role
  IF v_role = 'host' THEN
    v_status := 'pending';
  ELSE
    v_status := 'active'; -- Guests and Admins are auto-active by default
  END IF;

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
    name = EXCLUDED.name, -- Keep name updated
    email = EXCLUDED.email, -- Keep email updated
    avatar_url = EXCLUDED.avatar_url, -- Keep avatar updated
    -- IMPORTANT: Do not blindly reset status or role if they are already set correctly in specific states
    -- But if role changes in Metadata, we might want to update it.
    -- For now, we trust the metadata for Role, but Status is stateful.
    role = v_role,
    status = CASE 
        -- If the user is already approved/rejected/suspended, preserve that state 
        -- unless we specifically want to reset it (which we don't here).
        -- This prevents a login/update from resetting a Rejected host back to Pending/Active.
        WHEN public.users.status IN ('approved', 'rejected', 'suspended') THEN public.users.status 
        ELSE v_status 
    END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
