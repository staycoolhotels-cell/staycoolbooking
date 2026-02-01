UPDATE public.users
SET role = 'guest'
WHERE role IS NULL;