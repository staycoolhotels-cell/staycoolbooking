-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Hosts can insert their own properties" ON public.properties;
DROP POLICY IF EXISTS "Hosts can view their own properties" ON public.properties;
DROP POLICY IF EXISTS "Hosts can update their own properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can view all properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can update any property" ON public.properties;
DROP POLICY IF EXISTS "Public can view active properties" ON public.properties;

-- RLS Policies for Hosts

-- Hosts can insert properties if they are active
CREATE POLICY "Hosts can insert their own properties"
ON public.properties FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'host' AND
  (SELECT status FROM public.profiles WHERE id = auth.uid()) = 'active' AND
  auth.uid() = host_id
);

-- Hosts can view their own properties
CREATE POLICY "Hosts can view their own properties"
ON public.properties FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'host' AND
  auth.uid() = host_id
);

-- Hosts can update their own properties
CREATE POLICY "Hosts can update their own properties"
ON public.properties FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'host' AND
  auth.uid() = host_id
)
WITH CHECK (
  auth.uid() = host_id
);

-- RLS Policies for Admins

-- Admins can view all properties
CREATE POLICY "Admins can view all properties"
ON public.properties FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Admins can update any property
CREATE POLICY "Admins can update any property"
ON public.properties FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Public Access
-- Anyone can view active properties
CREATE POLICY "Public can view active properties"
ON public.properties FOR SELECT
TO anon, authenticated
USING (status = 'active');
