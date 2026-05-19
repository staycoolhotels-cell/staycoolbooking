-- ============================================================================
-- FIX PROPERTY STATUS - RUN THIS IN SUPABASE SQL EDITOR
-- ============================================================================
-- This script fixes the create_property function to use the default 'pending'
-- status instead of hardcoding 'active', ensuring all new properties require
-- admin approval before becoming active.
-- ============================================================================

-- Step 1: Drop the existing create_property function
DROP FUNCTION IF EXISTS public.create_property(
    text, text, text, numeric, numeric, text, text, jsonb, text, text, text, text
) CASCADE;

-- Step 2: Recreate the function WITHOUT explicitly setting status
-- This allows the table's default value of 'pending' to be used
CREATE OR REPLACE FUNCTION public.create_property(
    p_name text,
    p_title text,
    p_description text,
    p_price_per_night numeric,
    p_weekend_price_per_night numeric,
    p_location text,
    p_tier text,
    p_amenities jsonb,
    p_license_url text,
    p_tax_bill_url text,
    p_current_bill_url text,
    p_image_url text
)
RETURNS uuid
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_property_id uuid;
BEGIN
    -- Ensure the user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Insert the new property
    -- IMPORTANT: status column is NOT included here
    -- This means it will use the table's default value of 'pending'
    INSERT INTO public.properties (
        host_id,
        name,
        title,
        description,
        price_per_night,
        weekend_price_per_night,
        location,
        tier,
        amenities,
        license_url,
        tax_bill_url,
        current_bill_url,
        image_url
    )
    VALUES (
        auth.uid(),
        p_name,
        p_title,
        p_description,
        p_price_per_night,
        p_weekend_price_per_night,
        p_location,
        p_tier,
        p_amenities,
        p_license_url,
        p_tax_bill_url,
        p_current_bill_url,
        p_image_url
    )
    RETURNING id INTO new_property_id;

    RETURN new_property_id;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION public.create_property TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_property TO service_role;

-- Step 4: Verify the function was created correctly
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'create_property';

-- Step 5: Reload schema cache
NOTIFY pgrst, 'reload config';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check the default status for the properties table
SELECT 
    column_name, 
    column_default, 
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'properties' 
  AND column_name = 'status';

-- Expected result: column_default should be 'pending'::text

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- After running this script:
-- 1. New properties will be created with 'pending' status
-- 2. They will appear in the "Pending" tab on host dashboard
-- 3. Admins can approve/reject them from the admin panel
-- 4. Approved properties will move to "Active" tab
-- 5. Rejected properties will move to "Rejected" tab
-- ============================================================================
