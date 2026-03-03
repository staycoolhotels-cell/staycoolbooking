CREATE OR REPLACE FUNCTION public.update_property(
    p_id uuid,
    p_name text,
    p_title text,
    p_description text,
    p_price_per_night numeric,
    p_weekend_price_per_night numeric,
    p_tier text,
    p_amenities jsonb,
    p_license_url text,
    p_tax_bill_url text,
    p_current_bill_url text,
    p_image_url text,
    p_cancellation_policy text,
    p_rules text[],
    p_safety_items text[],
    p_bedrooms numeric,
    p_bathrooms numeric,
    p_max_guests numeric,
    p_area numeric,
    p_co_host_name text,
    p_co_host_email text,
    p_address_line1 text,
    p_address_line2 text,
    p_landmark text,
    p_district text,
    p_city text,
    p_state text,
    p_postal_code text,
    p_country text,
    p_show_specific_location boolean,
    p_location text
)
RETURNS SETOF public.properties
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    UPDATE public.properties
    SET
        title = p_title,
        description = p_description,
        price_per_night = p_price_per_night,
        weekend_price_per_night = p_weekend_price_per_night,
        tier = p_tier,
        amenities = p_amenities,
        license_url = p_license_url,
        tax_bill_url = p_tax_bill_url,
        current_bill_url = p_current_bill_url,
        image_url = p_image_url,
        cancellation_policy = p_cancellation_policy,
        rules = (select jsonb_agg(x) from unnest(p_rules) x),
        safety_items = p_safety_items,
        bedrooms = p_bedrooms,
        bathrooms = p_bathrooms,
        max_guests = p_max_guests,
        area = p_area,
        co_host_name = p_co_host_name,
        co_host_email = p_co_host_email,
        address_line1 = p_address_line1,
        address_line2 = p_address_line2,
        landmark = p_landmark,
        district = p_district,
        city = p_city,
        state = p_state,
        postal_code = p_postal_code,
        country = p_country,
        show_specific_location = p_show_specific_location,
        location = p_location,
        updated_at = now()
    WHERE id = p_id
    RETURNING *;
END;
$function$;
