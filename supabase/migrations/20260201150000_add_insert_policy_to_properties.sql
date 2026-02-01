CREATE POLICY "Allow authenticated users to insert property"
ON public.properties FOR INSERT
TO authenticated
WITH CHECK (host_id = auth.uid());
