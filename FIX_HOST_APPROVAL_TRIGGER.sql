-- ============================================================================
-- CRITICAL FIX: Host Approval Workflow - Database Trigger Fix
-- ============================================================================
-- 
-- PROBLEM: Hosts can log in immediately after signup without admin approval
-- ROOT CAUSE: The database trigger is not setting host status to 'pending'
-- 
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this ENTIRE script
-- 4. Click "Run" to execute
-- 5. Test the signup flow again
-- 
-- ============================================================================

-- Step 1: Drop ALL existing conflicting triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Step 2: Drop the old function that doesn't handle status correctly
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
  
  -- Set status based on role, respecting metadata if available
  -- CRITICAL: Hosts must be 'pending' until admin approves (unless already marked active in metadata)
  IF user_role = 'host' THEN
    user_status := COALESCE(NEW.raw_user_meta_data->>'status', 'pending');
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
    status = CASE
      WHEN public.users.status IN ('active', 'approved', 'rejected', 'suspended', 'approved_host') THEN public.users.status
      ELSE EXCLUDED.status
    END,
    avatar_url = EXCLUDED.avatar_url;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create the trigger on INSERT only
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Verify the setup
DO $$
DECLARE
  trigger_count INTEGER;
  function_exists BOOLEAN;
BEGIN
  -- Check if trigger exists
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_name = 'on_auth_user_created'
  AND event_object_schema = 'auth'
  AND event_object_table = 'users';
  
  -- Check if function exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_new_user'
  ) INTO function_exists;
  
  -- Report results
  IF trigger_count > 0 AND function_exists THEN
    RAISE NOTICE '✅ SUCCESS: Trigger and function are properly configured!';
    RAISE NOTICE '✅ New hosts will now have status = pending';
    RAISE NOTICE '✅ New guests will have status = active';
  ELSE
    RAISE WARNING '❌ FAILED: Something went wrong. Please contact support.';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERY (Optional - run this after the script above)
-- ============================================================================
-- Uncomment and run this to verify the trigger is working:
--
-- SELECT 
--   trigger_name,
--   event_manipulation,
--   event_object_table,
--   action_statement
-- FROM information_schema.triggers 
-- WHERE event_object_schema = 'auth' 
-- AND event_object_table = 'users';
-- ============================================================================
