-- Drop the old policies for authenticated users to ensure a clean state.
DROP POLICY IF EXISTS "Allow hosts to insert their own properties" ON public.properties;
DROP POLICY IF EXISTS "Allow hosts to update their own properties" ON public.properties;
DROP POLICY IF EXISTS "Allow hosts to delete their own properties" ON public.properties;
DROP POLICY IF EXISTS "Allow hosts to select their own properties" ON public.properties;

-- Create a clear, correct, and complete set of RLS policies for hosts managing their properties.

-- 1. INSERT: Authenticated users can insert properties if they set themselves as the host_id.
CREATE POLICY "1_Hosts_Can_Insert_Own_Properties"
ON public.properties FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = host_id);

-- 2. UPDATE: Authenticated users can update their own properties.
-- The 'USING' clause identifies which rows can be updated.
-- The 'WITH CHECK' clause prevents them from changing the host_id to someone else.
CREATE POLICY "2_Hosts_Can_Update_Own_Properties"
ON public.properties FOR UPDATE
TO authenticated
USING (auth.uid() = host_id)
WITH CHECK (auth.uid() = host_id);

-- 3. DELETE: Authenticated users can delete their own properties.
CREATE POLICY "3_Hosts_Can_Delete_Own_Properties"
ON public.properties FOR DELETE
TO authenticated
USING (auth.uid() = host_id);

-- 4. SELECT: Authenticated users can view their own properties.
-- This policy works in combination with the public-facing policy for active properties.
CREATE POLICY "User can see own properties"
ON public.properties FOR SELECT
TO authenticated
USING (auth.uid() = host_id);
