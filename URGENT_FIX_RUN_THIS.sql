-- URGENT FIX: Run this in Supabase Dashboard SQL Editor
-- This will completely remove the function overload issue

-- Step 1: Drop ALL versions of create_property (using CASCADE to remove dependencies)
DROP FUNCTION IF EXISTS public.create_property CASCADE;

-- Step 2: Wait a moment
SELECT pg_sleep(0.5);

-- Step 3: Create the ONE AND ONLY version with a slightly different approach
-- Using explicit type casts to avoid any ambiguity
CREATE OR REPLACE FUNCTION public.create_property(
    p_name text,
    p_title text,
    p_description text,
    p_price_per_night numeric,
    p_weekend_price_per_night numeric,
    p_location text,
    p_tier text,
    p_amenities jsonb DEFAULT '[]'::jsonb,
    p_license_url text DEFAULT '',
    p_tax_bill_url text DEFAULT '',
    p_current_bill_url text DEFAULT '',
    p_image_url text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_property_id uuid;
    current_user_id uuid;
BEGIN
    -- Get the authenticated user ID
    current_user_id := auth.uid();
    
    -- Ensure the user is authenticated
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Insert the new property
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
        image_url,
        status
    )
    VALUES (
        current_user_id,
        p_name,
        p_title,
        p_description,
        p_price_per_night::numeric,
        p_weekend_price_per_night::numeric,
        p_location,
        p_tier,
        COALESCE(p_amenities, '[]'::jsonb),
        COALESCE(p_license_url, ''),
        COALESCE(p_tax_bill_url, ''),
        COALESCE(p_current_bill_url, ''),
        COALESCE(p_image_url, ''),
        'active'
    )
    RETURNING id INTO new_property_id;

    RETURN new_property_id;
END;
$$;

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION public.create_property(text, text, text, numeric, numeric, text, text, jsonb, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_property(text, text, text, numeric, numeric, text, text, jsonb, text, text, text, text) TO service_role;

-- Step 5: Verify only ONE function exists
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'create_property';

-- You should see ONLY ONE row in the result
