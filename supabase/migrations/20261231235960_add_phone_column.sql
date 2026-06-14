-- Add missing phone column to public.users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone TEXT;
-- Update the handle_new_user trigger function to populate phone from auth metadata if present
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

  -- Set status based on role
  IF user_role = 'host' THEN
    user_status := 'pending';
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
-- Update handle_user_update trigger function to keep phone in sync
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

  -- Determine Status based on Role, but respect metadata if present
  IF v_role = 'host' THEN
    v_status := COALESCE(NEW.raw_user_meta_data->>'status', 'pending');
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
-- Force reload schema cache for PostgREST to immediately recognize the new column
NOTIFY pgrst, 'reload schema';
