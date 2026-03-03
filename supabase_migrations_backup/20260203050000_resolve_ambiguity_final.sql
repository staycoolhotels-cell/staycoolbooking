-- Migration to definitively resolve the create_property ambiguity
-- This migration explicitly drops both potentially conflicting versions of the function
-- and recreates the canonical version with NUMERIC types (best for currency)

-- 1. Drop the version with REAL types (if it exists)
-- We must match the signature EXACTLY for the drop to work if not using arguments, 
-- but using argument types is safer to target the specific overload.
DROP FUNCTION IF EXISTS public.create_property(
    text, text, text, real, real, text, text, jsonb, text, text, text, text
);

-- 2. Drop the version with NUMERIC types (if it exists)
DROP FUNCTION IF EXISTS public.create_property(
    text, text, text, numeric, numeric, text, text, jsonb, text, text, text, text
);

-- 3. Recreate the canonical function with NUMERIC types for prices
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

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION public.create_property TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_property TO service_role;

-- 5. Reload schema cache to ensure PostgREST sees the change immediately
NOTIFY pgrst, 'reload config';
