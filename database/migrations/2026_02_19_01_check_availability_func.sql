SELECT 
    p.proname as function_name, 
    pg_get_function_arguments(p.oid) as arguments,
    CASE WHEN p.prosecdef THEN 'TRUE' ELSE 'FALSE' END as security_definer
FROM pg_proc p 
JOIN pg_namespace n ON p.pronamespace = n.oid 
WHERE n.nspname = 'public' 
  AND p.proname = 'check_availability';
