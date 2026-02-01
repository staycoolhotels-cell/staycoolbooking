-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "1_Hosts_Can_Insert_Own_Properties" ON public.properties;
DROP POLICY IF EXISTS "2_Hosts_Can_Update_Own_Properties" ON public.properties;
DROP POLICY IF EXISTS "User can see own properties" ON public.properties;
DROP POLICY IF EXISTS "Allow hosts to select their own properties" ON public.properties;
DROP POLICY IF EXISTS "Properties are viewable by everyone." ON public.properties;
DROP POLICY IF EXISTS "Admin can read all properties" ON public.properties;
DROP POLICY IF EXISTS "Admin can update any property" ON public.properties;

-- RLS Policies for Hosts

-- Hosts can insert properties with status = 'pending'
CREATE POLICY "Hosts can insert their own properties"
ON public.properties FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = host_id AND status = 'pending');

-- Hosts can view their own properties
CREATE POLICY "Hosts can view their own properties"
ON public.properties FOR SELECT
TO authenticated
USING (auth.uid() = host_id);

-- Hosts can update their own properties (but not the status)
CREATE POLICY "Hosts can update their own properties"
ON public.properties FOR UPDATE
TO authenticated
USING (auth.uid() = host_id)
WITH CHECK (auth.uid() = host_id AND status <> 'active');

-- RLS Policies for Admins

-- Admins can view all properties
CREATE POLICY "Admins can view all properties"
ON public.properties FOR SELECT
TO authenticated
USING (get_my_claim('user_role') = '"admin"');

-- Admins can update any property (including status)
CREATE POLICY "Admins can update any property"
ON public.properties FOR UPDATE
TO authenticated
USING (get_my_claim('user_role') = '"admin"');

-- Public Access
-- Anyone can view active properties
CREATE POLICY "Public can view active properties"
ON public.properties FOR SELECT
TO anon, authenticated
USING (status = 'active');
