-- Add area column to properties table
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS area numeric;

-- Drop existing function to update signature
DROP FUNCTION IF EXISTS public.create_property(
    text, text, text, numeric, numeric, text, text, jsonb, text, text, text, text, text, jsonb, text[]
);

-- Recreate function with new parameters
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
    p_image_url text,
    p_cancellation_policy text,
    p_rules jsonb,
    p_safety_items jsonb,
    p_bedrooms numeric DEFAULT 0,
    p_bathrooms numeric DEFAULT 0,
    p_max_guests numeric DEFAULT 0,
    p_area numeric DEFAULT 0
)
RETURNS uuid
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_property_id uuid;
    v_rules text[];
    v_safety_items text[];
BEGIN
    -- Ensure the user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Cast jsonb arrays to text arrays if possible, or handle them as jsonb
    -- Ideally, the table columns are text[] or jsonb. Assuming they are text[] based on usage.
    -- If they are jsonb in the table, we can insert directly.
    -- Based on typescript, they seem to be string[].
    
    -- Convert jsonb to text[] for insertion if columns are text[]
    -- SELECT array_agg(x) INTO v_rules FROM jsonb_array_elements_text(p_rules) t(x);
    -- SELECT array_agg(x) INTO v_safety_items FROM jsonb_array_elements_text(p_safety_items) t(x);

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
        cancellation_policy,
        rules,
        safety_items,
        bedrooms,
        bathrooms,
        max_guests,
        area
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
        p_image_url,
        p_cancellation_policy,
        (SELECT array_agg(x) FROM jsonb_array_elements_text(p_rules) t(x)),
        (SELECT array_agg(x) FROM jsonb_array_elements_text(p_safety_items) t(x)),
        p_bedrooms,
        p_bathrooms,
        p_max_guests,
        p_area
    )
    RETURNING id INTO new_property_id;

    RETURN new_property_id;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.create_property TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_property TO service_role;

NOTIFY pgrst, 'reload config';
