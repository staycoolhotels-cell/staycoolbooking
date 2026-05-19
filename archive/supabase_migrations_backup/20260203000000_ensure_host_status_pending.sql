-- Migration to ensure proper host approval workflow
-- Adds rejection_reason column and ensures status handling is correct

-- Step 1: Add rejection_reason column to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE public.users ADD COLUMN rejection_reason TEXT;
  END IF;
END $$;

-- Step 2: Ensure status column allows all required values
-- Update any existing constraints if needed
ALTER TABLE public.users 
  ALTER COLUMN status SET DEFAULT 'pending';

-- Step 3: Update the handle_new_user trigger to properly set status based on role
-- This ensures hosts are set to 'pending' and guests are set to 'active'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_status TEXT;
BEGIN
  -- Get the role from metadata, default to 'guest'
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'guest');
  
  -- Set status based on role
  IF user_role = 'host' THEN
    user_status := 'pending';
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

-- Step 4: Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Add a comment to document the status values
COMMENT ON COLUMN public.users.status IS 'User status: pending (awaiting approval), active (approved), rejected (denied), suspended (temporarily disabled), approved_host (legacy, same as active for hosts)';
COMMENT ON COLUMN public.users.rejection_reason IS 'Reason provided by admin when rejecting a host application';
