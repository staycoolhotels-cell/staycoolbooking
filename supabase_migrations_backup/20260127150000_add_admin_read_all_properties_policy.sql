CREATE POLICY "Allow admins to read all properties"
ON public.properties FOR SELECT
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);
