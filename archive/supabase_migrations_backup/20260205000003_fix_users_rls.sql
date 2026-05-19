-- Fix RLS for public.users table
-- This is critical because property RLS policies often reference (SELECT role FROM public.users ...)
-- If authenticated users cannot read their own user record, that subquery returns NULL, failing the property policy.

-- 1. Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Allow users to read their own data
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 3. Allow admins to view all users (common requirement, good to ensure)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
CREATE POLICY "Admins can view all profiles"
ON public.users FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- 4. Allow service role full access (default, but good to be explicit if needed, though usually automatic)

-- 5. Grant permissions
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO service_role;
