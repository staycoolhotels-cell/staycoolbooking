-- Add new columns to properties table
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS cancellation_policy text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rules text[];
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS safety_items text[];

-- Drop existing function signatures to avoid ambiguity/overload confusion when calling from client
DROP FUNCTION IF EXISTS public.create_property(text, text, text, numeric, numeric, text, text, jsonb, text, text, text, text);

-- Update create_property function with new parameters
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
    p_cancellation_policy text DEFAULT NULL,
    p_rules text[] DEFAULT NULL,
    p_safety_items text[] DEFAULT NULL
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
        image_url,
        cancellation_policy,
        rules,
        safety_items
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
        p_rules,
        p_safety_items
    )
    RETURNING id INTO new_property_id;

    RETURN new_property_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_property TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_property TO service_role;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload config';
