-- Update the handle_new_user trigger function to default hosts to 'active'
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
  user_status TEXT;
BEGIN
  user_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'guest'));

  -- Set status based on role: default hosts to active as they must pay during signup
  IF user_role = 'host' THEN
    user_status := COALESCE(NEW.raw_user_meta_data->>'status', 'active');
  ELSIF user_role = 'admin' THEN
    user_status := 'active';
  ELSE
    user_status := 'active'; -- guests
  END IF;

  INSERT INTO public.users (id, name, email, role, status, avatar_url, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    user_role,
    user_status,
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone)
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    avatar_url = EXCLUDED.avatar_url,
    phone = COALESCE(EXCLUDED.phone, public.users.phone);

  RETURN NEW;
END;
$$;

-- Update handle_user_update trigger function to keep host status as 'active' (or respect metadata)
CREATE OR REPLACE FUNCTION public.handle_user_update() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  v_role text;
  v_status text;
  v_referral_code text;
BEGIN
  -- Determine Role
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'guest');
  v_role := lower(v_role);

  -- Determine Status based on Role, respect metadata if present, and default host to active
  IF v_role = 'host' THEN
    v_status := COALESCE(NEW.raw_user_meta_data->>'status', 'active');
  ELSE
    v_status := 'active';
  END IF;

  -- Generate a potential referral code
  v_referral_code := 'SC-' || upper(substring(md5(NEW.id::text || random()::text), 1, 6));

  INSERT INTO public.users (id, name, email, avatar_url, role, status, referral_code, phone)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'name', 
    NEW.email, 
    NEW.raw_user_meta_data->>'avatar_url', 
    v_role,
    v_status,
    v_referral_code,
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone)
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    avatar_url = EXCLUDED.avatar_url,
    role = v_role,
    status = CASE 
      WHEN public.users.status IN ('active', 'approved', 'rejected', 'suspended', 'approved_host') THEN public.users.status 
      ELSE v_status 
    END,
    referral_code = COALESCE(public.users.referral_code, EXCLUDED.referral_code),
    phone = COALESCE(EXCLUDED.phone, public.users.phone);

  RETURN NEW;
END;
$$;

-- Also update the unified handle_auth_user_sync trigger function if it exists
CREATE OR REPLACE FUNCTION public.handle_auth_user_sync()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
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

  -- Determine the target status: default hosts to active as they must pay during signup
  IF v_role = 'host' THEN
    v_status := COALESCE(NEW.raw_user_meta_data->>'status', 'active');
  ELSE
    v_status := 'active';
  END IF;

  -- Perform the UPSERT into public.users
  INSERT INTO public.users (id, name, email, role, status, avatar_url, phone)
  VALUES (
    NEW.id,
    v_name,
    NEW.email,
    v_role,
    v_status,
    v_avatar,
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone)
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, public.users.name),
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    phone = COALESCE(EXCLUDED.phone, public.users.phone),
    status = CASE
      WHEN public.users.status IN ('active', 'approved', 'approved_host') THEN public.users.status
      WHEN public.users.status = 'rejected' THEN public.users.status
      WHEN public.users.status = 'suspended' THEN public.users.status
      ELSE v_status
    END;

  RETURN NEW;
END;
$$;
