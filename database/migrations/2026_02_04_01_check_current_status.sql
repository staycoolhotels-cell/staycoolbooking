-- DIAGNOSTIC QUERY - Run this in Supabase SQL Editor to check current state
-- This will help us understand what's happening

-- 1. Check the current create_property function definition
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) as full_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'create_property';

-- 2. Check the properties table default status
SELECT 
    column_name, 
    column_default, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'properties' 
  AND column_name = 'status';

-- 3. Check existing properties and their statuses
SELECT 
    id,
    name,
    host_id,
    status,
    created_at,
    updated_at
FROM public.properties
ORDER BY created_at DESC
LIMIT 10;

-- 4. Count properties by status
SELECT 
    status,
    COUNT(*) as count
FROM public.properties
GROUP BY status;
