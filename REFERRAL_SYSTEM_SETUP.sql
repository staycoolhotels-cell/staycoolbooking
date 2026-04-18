-- 1. Add Columns to Users Table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.users(id);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_benefit_count INTEGER DEFAULT 0;

-- 2. Add Column to Bookings Table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS referral_discount_applied BOOLEAN DEFAULT FALSE;

-- 3. Seed Existing Users with Referral Codes
UPDATE public.users 
SET referral_code = 'SC-' || upper(substring(md5(id::text || random()::text), 1, 6))
WHERE referral_code IS NULL;

-- 4. Update Trigger Function to auto-generate code for new users
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
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

  INSERT INTO public.users (id, name, email, avatar_url, role, status, referral_code)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'name', 
    NEW.email, 
    NEW.raw_user_meta_data->>'avatar_url', 
    v_role,
    v_status,
    v_referral_code
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
    referral_code = COALESCE(public.users.referral_code, EXCLUDED.referral_code);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Helper Function to decrement benefit count safely
CREATE OR REPLACE FUNCTION public.decrement_referral_benefit(p_host_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users 
  SET referral_benefit_count = GREATEST(0, referral_benefit_count - 1)
  WHERE id = p_host_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
