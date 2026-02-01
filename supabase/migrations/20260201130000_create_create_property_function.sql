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
RETURNS uuid AS $$
DECLARE
    new_property_id uuid;
BEGIN
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
