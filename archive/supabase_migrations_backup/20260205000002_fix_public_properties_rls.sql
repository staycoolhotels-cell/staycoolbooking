-- Fix Public Access to Properties RLS
-- This migration ensures that guest users (anon role) can view active properties

-- 1. Drop the existing policy to avoid conflicts or staleness
DROP POLICY IF EXISTS "Public can view active properties" ON public.properties;

-- 2. Re-create the policy explicitly allowing anon and authenticated access
CREATE POLICY "Public can view active properties"
ON public.properties FOR SELECT
TO anon, authenticated
USING (status = 'active');

-- 3. Ensure RLS is enabled on the table (just in case, though it should be)
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- 4. Grant necessary permissions (if not already present)
GRANT SELECT ON public.properties TO anon;
GRANT SELECT ON public.properties TO authenticated;
