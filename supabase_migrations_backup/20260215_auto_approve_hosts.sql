-- Migration to auto-approve hosts and update existing pending hosts
-- 1. Update the handle_new_user trigger to set status = 'active' for hosts automatically
-- 2. Update all existing users with role = 'host' and status = 'pending' to 'active'

-- Step 1: Update the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_status TEXT;
BEGIN
  -- Get the role from metadata, default to 'guest'
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'guest');
  
  -- Set status based on role
  -- HOST APPROVAL REMOVED: Hosts are now 'active' by default, just like guests
  IF user_role = 'host' THEN
    user_status := 'active'; -- WAS 'pending'
  ELSE
    user_status := 'active';
  END IF;

  -- Insert or update the user in the public.users table
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

-- Step 2: Update existing pending hosts to active
UPDATE public.users
SET status = 'active'
WHERE role = 'host' AND status = 'pending';

-- Step 3: Also update auth.users metadata if needed (optional but good for consistency)
-- We can't easily update auth.users metadata in SQL without specific extensions or direct table access which might be restricted.
-- But the public.users table is the source of truth for our app logic, so the above UPDATE is sufficient.
