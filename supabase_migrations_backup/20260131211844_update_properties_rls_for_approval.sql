-- Drop the existing broad public select policy
DROP POLICY IF EXISTS "Anyone can view properties" ON public.properties;

-- Policy for public users (anon) and authenticated users to view ONLY approved properties
CREATE POLICY "Enable read access for approved properties"
ON public.properties FOR SELECT
USING (status = 'approved');

-- Policy for hosts to view their own properties (all statuses)
CREATE POLICY "Hosts can view their own properties"
ON public.properties FOR SELECT
USING (host_id = auth.uid());
