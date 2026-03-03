-- Check the actual structure of the properties table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'properties'
ORDER BY ordinal_position;

-- This will show us all the columns that actually exist in the properties table
