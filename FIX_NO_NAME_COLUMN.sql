-- FIX: Remove the 'name' column reference since it doesn't exist
-- The properties table only has 'title', not 'name'

DROP FUNCTION IF EXISTS public.create_property(text, text, text, numeric, numeric, text, text, jsonb, text, text, text, text) CASCADE;

CREATE FUNCTION public.create_property(
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

    -- Insert the new property (REMOVED 'name' column)
    INSERT INTO public.properties (
        host_id,
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
        COALESCE(p_title, p_name),  -- Use p_title if provided, otherwise fall back to p_name
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_property(text, text, text, numeric, numeric, text, text, jsonb, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_property(text, text, text, numeric, numeric, text, text, jsonb, text, text, text, text) TO service_role;

-- Verify
SELECT 'SUCCESS! Function updated without name column' as status;
