-- Test script to check if the database trigger is working correctly
-- Run this to verify the handle_new_user function and trigger exist

-- 1. Check if the trigger function exists
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'handle_new_user';

-- 2. Check if the trigger exists on auth.users
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'auth' 
AND event_object_table = 'users'
AND trigger_name LIKE '%auth_user%';

-- 3. Check current users and their status
SELECT 
    id,
    email,
    role,
    status,
    created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check if any hosts have 'pending' status
SELECT 
    COUNT(*) as pending_hosts_count
FROM public.users
WHERE role = 'host' AND status = 'pending';

-- 5. View the actual trigger function definition
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'handle_new_user';
