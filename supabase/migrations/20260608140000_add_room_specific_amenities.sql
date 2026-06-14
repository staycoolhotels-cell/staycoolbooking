-- Add room_amenities to rooms table
ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS room_amenities JSONB DEFAULT '[]'::JSONB;

-- Add room_type_amenities to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS room_type_amenities JSONB DEFAULT '{}'::JSONB;

-- Update create_property function to handle room_type_amenities
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
    p_total_rooms integer DEFAULT 1,
    p_room_types text[] DEFAULT ARRAY[]::text[],
    p_check_in_time text DEFAULT NULL::text,
    p_check_out_time text DEFAULT NULL::text,
    p_room_type_amenities jsonb DEFAULT '{}'::jsonb -- NEW PARAMETER
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_property_id uuid;
    i integer;
    v_default_room_type text;
    v_room_amenities jsonb;
BEGIN
    -- Ensure the user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Set default room type and its amenities
    IF array_length(p_room_types, 1) > 0 THEN
        v_default_room_type := p_room_types[1];
        v_room_amenities := COALESCE((p_room_type_amenities->>v_default_room_type)::jsonb, '[]'::jsonb);
    ELSE
        v_room_amenities := '[]'::jsonb;
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
        total_rooms,
        room_types,
        check_in_time,
        check_out_time,
        room_type_amenities -- Insert new column
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
        p_total_rooms,
        p_room_types,
        p_check_in_time,
        p_check_out_time,
        p_room_type_amenities
    )
    RETURNING id INTO new_property_id;

    -- Automatically create rooms with assigned amenities
    IF p_total_rooms > 0 THEN
        FOR i IN 1..p_total_rooms LOOP
            INSERT INTO public.rooms (property_id, name, status, room_type, room_amenities)
            VALUES (new_property_id, 'Room ' || i, 'available', v_default_room_type, v_room_amenities);
        END LOOP;
    END IF;

    RETURN new_property_id;
END;
$$;

-- Update update_property function to handle room_type_amenities
CREATE OR REPLACE FUNCTION public.update_property(
    p_id uuid,
    p_name text DEFAULT NULL,
    p_title text DEFAULT NULL,
    p_description text DEFAULT NULL,
    p_price_per_night numeric DEFAULT NULL,
    p_weekend_price_per_night numeric DEFAULT NULL,
    p_tier text DEFAULT NULL,
    p_amenities jsonb DEFAULT NULL,
    p_license_url text DEFAULT NULL,
    p_tax_bill_url text DEFAULT NULL,
    p_current_bill_url text DEFAULT NULL,
    p_image_url text DEFAULT NULL,
    p_cancellation_policy text DEFAULT NULL,
    p_rules text[] DEFAULT NULL,
    p_safety_items text[] DEFAULT NULL,
    p_bedrooms integer DEFAULT NULL,
    p_beds integer DEFAULT NULL,
    p_bathrooms numeric DEFAULT NULL,
    p_max_guests integer DEFAULT NULL,
    p_area numeric DEFAULT NULL,
    p_co_host_name text DEFAULT NULL,
    p_co_host_email text DEFAULT NULL,
    p_address_line1 text DEFAULT NULL,
    p_address_line2 text DEFAULT NULL,
    p_landmark text DEFAULT NULL,
    p_district text DEFAULT NULL,
    p_city text DEFAULT NULL,
    p_state text DEFAULT NULL,
    p_postal_code text DEFAULT NULL,
    p_country text DEFAULT NULL,
    p_show_specific_location boolean DEFAULT NULL,
    p_location text DEFAULT NULL,
    p_total_rooms integer DEFAULT NULL,
    p_room_types text[] DEFAULT NULL,
    p_check_in_time text DEFAULT NULL,
    p_check_out_time text DEFAULT NULL,
    p_room_type_amenities jsonb DEFAULT NULL -- NEW PARAMETER
)
RETURNS SETOF public.properties
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_total_rooms integer;
    v_rooms_to_add integer;
    i integer;
    v_default_room_type text;
    v_room_amenities jsonb;
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
        total_rooms = COALESCE(p_total_rooms, total_rooms),
        room_types = COALESCE(p_room_types, room_types),
        check_in_time = COALESCE(p_check_in_time, check_in_time),
        check_out_time = COALESCE(p_check_out_time, check_out_time),
        room_type_amenities = COALESCE(p_room_type_amenities, room_type_amenities)
    WHERE id = p_id AND host_id = auth.uid()
    RETURNING *;

    -- Handle room creation if total_rooms increased
    IF p_total_rooms IS NOT NULL AND p_total_rooms > COALESCE(v_current_total_rooms, 0) THEN
        v_rooms_to_add := p_total_rooms - COALESCE(v_current_total_rooms, 0);
        
        -- Use the first room type as default if available
        IF array_length(p_room_types, 1) > 0 THEN
            v_default_room_type := p_room_types[1];
            v_room_amenities := COALESCE((p_room_type_amenities->>v_default_room_type)::jsonb, '[]'::jsonb);
        ELSE
            v_room_amenities := '[]'::jsonb;
        END IF;

        FOR i IN 1..v_rooms_to_add LOOP
             INSERT INTO public.rooms (property_id, name, status, room_type, room_amenities)
             VALUES (p_id, 'New Room ' || (COALESCE(v_current_total_rooms, 0) + i), 'available', v_default_room_type, v_room_amenities);
        END LOOP;
    END IF;

    RETURN QUERY SELECT * FROM public.properties WHERE id = p_id;
END;
$$;
