-- Policies for the profiles table

-- Admins can see all profiles
CREATE POLICY "admin_read_all_profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Users can see their own profile
CREATE POLICY "user_read_own_profile"
ON public.profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid()
);

-- Admins can update any profile
CREATE POLICY "admin_update_any_profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
