GRANT EXECUTE ON FUNCTION public.create_property TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_property TO service_role;
NOTIFY pgrst, 'reload config';
