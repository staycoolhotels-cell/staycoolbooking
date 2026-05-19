-- DIAGNOSTIC SCRIPT: Run this FIRST to see what functions exist
-- This will help us understand what we're dealing with

SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) as full_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'create_property';

-- After running this, you'll see ALL versions of the function
-- Copy the output and share it with me if the NUCLEAR_FIX doesn't work
