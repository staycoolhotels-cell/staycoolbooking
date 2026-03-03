-- Migration to update create_property and update_property for Bulk Booking
-- accepting p_total_rooms and creating/managing room records

-- 1. Update create_property
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
    p_cancellation_policy text DEFAULT 'Flexible',
    p_rules text[] DEFAULT ARRAY[]::text[],
    p_safety_items text[] DEFAULT ARRAY[]::text[],
    p_bedrooms integer DEFAULT 1,
    p_beds integer DEFAULT 1,
    p_bathrooms numeric DEFAULT 1,
    p_max_guests integer DEFAULT 2,
    p_area numeric DEFAULT 500,
    p_co_host_name text DEFAULT NULL::text,
    p_co_host_email text DEFAULT NULL::text,
    p_address_line1 text DEFAULT NULL::text,
    p_address_line2 text DEFAULT NULL::text,
    p_landmark text DEFAULT NULL::text,
    p_district text DEFAULT NULL::text,
    p_city text DEFAULT NULL::text,
    p_state text DEFAULT NULL::text,
    p_postal_code text DEFAULT NULL::text,
    p_country text DEFAULT 'India - IN'::text,
    p_show_specific_location boolean DEFAULT false,
    p_total_rooms integer DEFAULT 1 -- NEW PARAMETER
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_property_id uuid;
    i integer;
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
        safety_items,
        bedrooms,
        beds,
        bathrooms,
        max_guests,
        area,
        co_host_name,
        co_host_email,
        address_line1,
        address_line2,
        landmark,
        district,
        city,
        state,
        postal_code,
        country,
        show_specific_location,
        total_rooms -- Insert new column
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
        p_safety_items,
        p_bedrooms,
        p_beds,
        p_bathrooms,
        p_max_guests,
        p_area,
        p_co_host_name,
        p_co_host_email,
        p_address_line1,
        p_address_line2,
        p_landmark,
        p_district,
        p_city,
        p_state,
        p_postal_code,
        p_country,
        p_show_specific_location,
        p_total_rooms
    )
    RETURNING id INTO new_property_id;

    -- Automatically create rooms
    IF p_total_rooms > 0 THEN
        FOR i IN 1..p_total_rooms LOOP
            INSERT INTO public.rooms (property_id, name, status)
            VALUES (new_property_id, 'Room ' || i, 'available');
        END LOOP;
    END IF;

    RETURN new_property_id;
END;
$$;


-- 2. Update update_property
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
    p_cancellation_policy text DEFAULT NULL::text,
    p_rules text[] DEFAULT NULL::text[],
    p_safety_items text[] DEFAULT NULL::text[],
    p_bedrooms integer DEFAULT NULL::integer,
    p_beds integer DEFAULT NULL::integer,
    p_bathrooms numeric DEFAULT NULL::numeric,
    p_max_guests integer DEFAULT NULL::integer,
    p_area numeric DEFAULT NULL::numeric,
    p_co_host_name text DEFAULT NULL::text,
    p_co_host_email text DEFAULT NULL::text,
    p_address_line1 text DEFAULT NULL::text,
    p_address_line2 text DEFAULT NULL::text,
    p_landmark text DEFAULT NULL::text,
    p_district text DEFAULT NULL::text,
    p_city text DEFAULT NULL::text,
    p_state text DEFAULT NULL::text,
    p_postal_code text DEFAULT NULL::text,
    p_country text DEFAULT NULL::text,
    p_show_specific_location boolean DEFAULT NULL::boolean,
    p_location text DEFAULT NULL::text,
    p_total_rooms integer DEFAULT NULL::integer -- NEW PARAMETER, Optional
)
RETURNS SETOF public.properties
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_total_rooms integer;
    v_rooms_to_add integer;
    i integer;
BEGIN
    -- Check ownership
    IF NOT EXISTS (SELECT 1 FROM public.properties WHERE id = p_id AND host_id = auth.uid()) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Get current total rooms if updating
    IF p_total_rooms IS NOT NULL THEN
        SELECT total_rooms INTO v_current_total_rooms FROM public.properties WHERE id = p_id;
    END IF;

    UPDATE public.properties
    SET
        name = COALESCE(p_name, name),
        title = COALESCE(p_title, title),
        description = COALESCE(p_description, description),
        price_per_night = COALESCE(p_price_per_night, price_per_night),
        weekend_price_per_night = COALESCE(p_weekend_price_per_night, weekend_price_per_night),
        tier = COALESCE(p_tier, tier),
        amenities = COALESCE(p_amenities, amenities),
        license_url = COALESCE(p_license_url, license_url),
        tax_bill_url = COALESCE(p_tax_bill_url, tax_bill_url),
        current_bill_url = COALESCE(p_current_bill_url, current_bill_url),
        image_url = COALESCE(p_image_url, image_url),
        cancellation_policy = COALESCE(p_cancellation_policy, cancellation_policy),
        rules = COALESCE(p_rules, rules),
        safety_items = COALESCE(p_safety_items, safety_items),
        bedrooms = COALESCE(p_bedrooms, bedrooms),
        beds = COALESCE(p_beds, beds),
        bathrooms = COALESCE(p_bathrooms, bathrooms),
        max_guests = COALESCE(p_max_guests, max_guests),
        area = COALESCE(p_area, area),
        co_host_name = COALESCE(p_co_host_name, co_host_name),
        co_host_email = COALESCE(p_co_host_email, co_host_email),
        address_line1 = COALESCE(p_address_line1, address_line1),
        address_line2 = COALESCE(p_address_line2, address_line2),
        landmark = COALESCE(p_landmark, landmark),
        district = COALESCE(p_district, district),
        city = COALESCE(p_city, city),
        state = COALESCE(p_state, state),
        postal_code = COALESCE(p_postal_code, postal_code),
        country = COALESCE(p_country, country),
        show_specific_location = COALESCE(p_show_specific_location, show_specific_location),
        location = COALESCE(p_location, location),
        total_rooms = COALESCE(p_total_rooms, total_rooms)
    WHERE id = p_id AND host_id = auth.uid()
    RETURNING *;

    -- Handle room creation if total_rooms increased
    IF p_total_rooms IS NOT NULL AND p_total_rooms > v_current_total_rooms THEN
        v_rooms_to_add := p_total_rooms - v_current_total_rooms;
        -- We just add "Room X" - naming might collide if we deleted some, but simple "Room X" is fine for now or UUIDs.
        -- Better: Select max number from existing names if they follow "Room X" pattern?
        -- For simplicity, let's just append generic names.
        FOR i IN 1..v_rooms_to_add LOOP
             INSERT INTO public.rooms (property_id, name, status)
             VALUES (p_id, 'New Room ' || (v_current_total_rooms + i), 'available');
        END LOOP;
    END IF;
    -- Note: We generally don't delete rooms automatically if total_rooms decreased, to avoid losing booking data. 
    -- The user can manually delete rooms in Room Manager. Or we could warn them. 
    -- For now, we only add.

    RETURN QUERY SELECT * FROM public.properties WHERE id = p_id;
END;
$$;
