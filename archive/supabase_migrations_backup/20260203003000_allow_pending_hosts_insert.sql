-- Allow pending hosts to insert properties
-- This is necessary so they can complete their onboarding/profile setup

-- Drop existing insert policy
DROP POLICY IF EXISTS "Hosts can insert their own properties" ON public.properties;

-- Re-create policy allowing both 'active' and 'pending' hosts
CREATE POLICY "Hosts can insert their own properties"
ON public.properties FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'host' AND
  (SELECT status FROM public.users WHERE id = auth.uid()) IN ('active', 'pending') AND
  auth.uid() = host_id
);
