-- Drop all existing policies on public.properties
DROP POLICY IF EXISTS "Anyone can view properties" ON public.properties;
DROP POLICY IF EXISTS "Enable read access for approved properties" ON public.properties;
DROP POLICY IF EXISTS "Hosts can view their own properties" ON public.properties;
DROP POLICY IF EXISTS "Allow hosts to insert their own properties" ON public.properties;

-- 1. Policy for public users (anon) and authenticated users to view ONLY approved properties
CREATE POLICY "Public can see approved properties"
ON public.properties FOR SELECT
USING (status = 'approved');

-- 2. Policy for hosts to view their own properties (all statuses)
CREATE POLICY "Hosts can manage their own properties"
ON public.properties FOR SELECT
USING (host_id = auth.uid());

-- 3. Policy for hosts to insert their own properties
CREATE POLICY "Hosts can insert their own properties"
ON public.properties FOR INSERT
WITH CHECK (host_id = auth.uid());
