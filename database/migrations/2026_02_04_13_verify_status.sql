
-- Test script to verify create_property status
DO $$
DECLARE
    new_prop_id uuid;
    prop_status text;
BEGIN
    -- Call the function (mocking inputs)
    -- Note: This requires an authenticated user context which calls usually have.
    -- Since we are running as service_role/postgres in SQL tool, auth.uid() might be null.
    -- We'll try to insert directly or verify the default if possible, but testing constraints is better.
    
    -- Actually, since I can't easily spoof auth.uid() in a simple SQL script without setting request headers,
    -- I will inspect the function definition to be 100% sure.
    NULL;
END
$$;

SELECT prosrc FROM pg_proc WHERE proname = 'create_property';
