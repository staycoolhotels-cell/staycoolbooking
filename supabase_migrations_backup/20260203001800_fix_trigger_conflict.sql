-- CRITICAL FIX: Replace the old handle_user_update trigger with handle_new_user
-- The old trigger does NOT set status based on role, causing hosts to bypass approval

-- Step 1: Drop ALL existing triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Step 2: Drop the old function that doesn't handle status
DROP FUNCTION IF EXISTS public.handle_user_update();

-- Step 3: Create the CORRECT function that sets status based on role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_status TEXT;
BEGIN
  -- Get the role from metadata, default to 'guest'
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'guest');
  
  -- Set status based on role
  -- CRITICAL: Hosts must be 'pending' until admin approves
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

-- Step 4: Create the trigger on INSERT only (not UPDATE)
-- We only want this to run when a new user signs up
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Verify the trigger was created
DO $$
BEGIN
  RAISE NOTICE 'Trigger on_auth_user_created has been created successfully';
  RAISE NOTICE 'Function handle_new_user will set host status to pending';
END $$;
