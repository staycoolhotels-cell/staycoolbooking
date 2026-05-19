-- Update create_property to use SECURITY DEFINER to bypass RLS
-- This ensures that the function runs with the privileges of the creator (likely admin/postgres)
-- allowing property creation even if RLS checks on public.profiles/public.users are failing or complex.
-- We still use auth.uid() to correctly attribute the property to the calling user.

CREATE OR REPLACE FUNCTION public.create_property(
    name text,
    title text,
    description text,
    price_per_night real,
    weekend_price_per_night real,
    location text,
    tier text,
    amenities jsonb,
    license_url text,
    tax_bill_url text,
    current_bill_url text,
    image_url text
)
RETURNS uuid
SECURITY DEFINER -- Run with privileges of the function creator
SET search_path = public -- Set search path for security
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
    RETURNING id INTO new_property_id;
    RETURN new_property_id;
END;
$$ LANGUAGE plpgsql;
