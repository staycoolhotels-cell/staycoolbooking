-- Quick verification script to check if activities are properly configured
-- Run this to verify the recent activity fix

-- Check if the new columns exist
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'activities' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check recent activities with all fields
SELECT 
    id,
    type,
    title,
    description,
    status,
    created_at,
    user_id
FROM public.activities 
ORDER BY created_at DESC 
LIMIT 10;

-- Count activities by status
SELECT 
    status,
    COUNT(*) as count
FROM public.activities
GROUP BY status;

-- Count activities by type
SELECT 
    type,
    COUNT(*) as count
FROM public.activities
GROUP BY type;
