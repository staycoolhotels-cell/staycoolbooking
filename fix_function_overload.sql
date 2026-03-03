-- Fix for function overload issue
-- This script removes ALL versions of create_property and creates a single canonical version

-- 1. Drop ALL possible versions of the function
-- We need to be exhaustive to catch all overloads

-- Drop version with REAL types
DROP FUNCTION IF EXISTS public.create_property(
    text, text, text, real, real, text, text, jsonb, text, text, text, text
) CASCADE;

-- Drop version with NUMERIC types
DROP FUNCTION IF EXISTS public.create_property(
    text, text, text, numeric, numeric, text, text, jsonb, text, text, text, text
) CASCADE;

-- Drop version with DOUBLE PRECISION types
DROP FUNCTION IF EXISTS public.create_property(
    text, text, text, double precision, double precision, text, text, jsonb, text, text, text, text
) CASCADE;

-- Drop version with INTEGER types (just in case)
DROP FUNCTION IF EXISTS public.create_property(
    text, text, text, integer, integer, text, text, jsonb, text, text, text, text
) CASCADE;

-- Drop version with BIGINT types (just in case)
DROP FUNCTION IF EXISTS public.create_property(
    text, text, text, bigint, bigint, text, text, jsonb, text, text, text, text
) CASCADE;

-- Drop any version without explicit types (shouldn't exist, but just in case)
DROP FUNCTION IF EXISTS public.create_property CASCADE;

-- 2. Wait a moment for the drops to complete
SELECT pg_sleep(1);

-- 3. Create the SINGLE canonical version with explicit NUMERIC types
-- NUMERIC is best for currency values as it avoids floating-point precision issues
CREATE FUNCTION public.create_property(
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
LANGUAGE plpgsql
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
        auth.uid(),
        p_name,
        p_title,
        p_description,
        p_price_per_night,
        p_weekend_price_per_night,
        p_location,
        p_tier,
        COALESCE(p_amenities, '[]'::jsonb),
        p_license_url,
        p_tax_bill_url,
        p_current_bill_url,
        p_image_url,
        'active'
    )
    RETURNING id INTO new_property_id;

    RETURN new_property_id;
END;
$$;

-- 4. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_property(
    text, text, text, numeric, numeric, text, text, jsonb, text, text, text, text
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.create_property(
    text, text, text, numeric, numeric, text, text, jsonb, text, text, text, text
) TO service_role;

-- 5. Add a comment to document the function
COMMENT ON FUNCTION public.create_property IS 
'Creates a new property for the authenticated host. Uses SECURITY DEFINER to bypass RLS.';

-- 6. Reload the schema cache
NOTIFY pgrst, 'reload config';

-- 7. Verify the function exists and is unique
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'create_property';
