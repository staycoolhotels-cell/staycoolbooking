-- MANUAL FIX FOR USERS.ROLE COLUMN
-- Execute this SQL in your Supabase SQL Editor
-- Navigate to: https://dlislsrlwovcxsuqdlvy.supabase.co/project/_/sql

-- Step 1: Add default value to the role column
ALTER TABLE public.users 
ALTER COLUMN role SET DEFAULT 'guest';

-- Step 2: Update any existing NULL role values to 'guest'
UPDATE public.users
SET role = 'guest'
WHERE role IS NULL;

-- Step 3: Replace the handle_new_user function with correct implementation
-- This function now properly reads role from user_metadata with fallback to 'guest'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'name', 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'role', 'guest')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Ensure the trigger exists and is properly configured
-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Create the trigger to handle new user creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verification queries (run these after executing the above)
-- Check if default value is set:
-- SELECT column_default FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role';

-- Check for any NULL role values:
-- SELECT id, name, email, role FROM public.users WHERE role IS NULL;
