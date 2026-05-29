-- Sync public.users to public.profiles to prevent foreign key constraint violations safely
DO $$
DECLARE
    u RECORD;
BEGIN
    FOR u IN SELECT id, name, email, role, avatar_url FROM public.users LOOP
        BEGIN
            INSERT INTO public.profiles (id, full_name, email, role, avatar_url)
            VALUES (
                u.id, 
                u.name,
                u.email,
                COALESCE(u.role, 'guest'),
                u.avatar_url
            )
            ON CONFLICT (id) DO UPDATE 
            SET full_name = EXCLUDED.full_name, email = EXCLUDED.email, role = EXCLUDED.role, avatar_url = EXCLUDED.avatar_url;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to sync user %, error %', u.id, SQLERRM;
        END;
    END LOOP;
END $$;
