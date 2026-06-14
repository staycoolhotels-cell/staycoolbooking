-- Add room_type_prices and room_type_weekend_prices to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS room_type_prices JSONB DEFAULT '{}'::JSONB,
ADD COLUMN IF NOT EXISTS room_type_weekend_prices JSONB DEFAULT '{}'::JSONB;

-- Update create_property function to handle room_type_prices
CREATE OR REPLACE FUNCTION public.create_property(
    p_name text DEFAULT NULL::text,
    p_title text DEFAULT NULL::text,
    p_description text DEFAULT NULL::text,
    p_price_per_night numeric DEFAULT 0,
    p_weekend_price_per_night numeric DEFAULT 0,
    p_tier text DEFAULT NULL::text,
    p_amenities jsonb DEFAULT '[]'::jsonb,
    p_license_url text DEFAULT ''::text,
    p_tax_bill_url text DEFAULT ''::text,
    p_current_bill_url text DEFAULT ''::text,
    p_aadhar_url text DEFAULT ''::text,
    p_pan_url text DEFAULT ''::text,
    p_noc_url text DEFAULT ''::text,
    p_image_url text DEFAULT ''::text,
    p_images jsonb DEFAULT '[]'::jsonb,
    p_cancellation_policy text DEFAULT 'Flexible'::text,
    p_rules jsonb DEFAULT '[]'::jsonb,
    p_safety_items jsonb DEFAULT '[]'::jsonb,
    p_bedrooms integer DEFAULT 1,
    p_beds integer DEFAULT 1,
    p_bathrooms numeric DEFAULT 1,
    p_max_guests integer DEFAULT 2,
    p_area numeric DEFAULT 0,
    p_address_line1 text DEFAULT ''::text,
    p_address_line2 text DEFAULT ''::text,
    p_landmark text DEFAULT ''::text,
    p_district text DEFAULT ''::text,
    p_city text DEFAULT ''::text,
    p_state text DEFAULT ''::text,
    p_postal_code text DEFAULT ''::text,
    p_country text DEFAULT 'India - IN'::text,
    p_location text DEFAULT ''::text,
    p_total_rooms integer DEFAULT 1,
    p_check_in_time text DEFAULT '12:00 PM'::text,
    p_check_out_time text DEFAULT '11:00 AM'::text,
    p_latitude numeric DEFAULT NULL::numeric,
    p_longitude numeric DEFAULT NULL::numeric,
    p_room_types text[] DEFAULT ARRAY[]::text[],
    p_room_type_amenities jsonb DEFAULT '{}'::jsonb,
    p_bulk_booking_discount numeric DEFAULT 10,
    p_room_type_prices jsonb DEFAULT '{}'::jsonb, -- NEW PARAMETER
    p_room_type_weekend_prices jsonb DEFAULT '{}'::jsonb -- NEW PARAMETER
) RETURNS uuid AS $$
DECLARE
    new_property_id uuid;
    v_host_id uuid;
    v_default_room_type text;
    v_room_amenities jsonb;
BEGIN
    v_host_id := auth.uid();
    
    INSERT INTO public.properties (
        name, title, description, price_per_night, weekend_price_per_night,
        tier, amenities, license_url, tax_bill_url, current_bill_url,
        aadhar_url, pan_url, noc_url, image_url, images,
        cancellation_policy, rules, safety_items, bedrooms, beds,
        bathrooms, max_guests, area, host_id,
        address_line1, address_line2, landmark, district, city,
        state, postal_code, country, location, total_rooms,
        check_in_time, check_out_time, latitude, longitude,
        room_types, room_type_amenities, bulk_booking_discount,
        room_type_prices, room_type_weekend_prices -- Insert new columns
    ) VALUES (
        p_name, p_title, p_description, p_price_per_night, p_weekend_price_per_night,
        p_tier, p_amenities, p_license_url, p_tax_bill_url, p_current_bill_url,
        p_aadhar_url, p_pan_url, p_noc_url, p_image_url, p_images,
        p_cancellation_policy, p_rules, p_safety_items, p_bedrooms, p_beds,
        p_bathrooms, p_max_guests, p_area, v_host_id,
        p_address_line1, p_address_line2, p_landmark, p_district, p_city,
        p_state, p_postal_code, p_country, p_location, p_total_rooms,
        p_check_in_time, p_check_out_time, p_latitude, p_longitude,
        p_room_types, p_room_type_amenities, p_bulk_booking_discount,
        p_room_type_prices, p_room_type_weekend_prices
    ) RETURNING id INTO new_property_id;

    -- Automatically create rooms if not a single-unit property
    IF p_tier NOT IN ('Home Stay', 'Apartment', 'Villa', 'Dormitory') AND p_total_rooms > 0 THEN
        IF array_length(p_room_types, 1) > 0 THEN
            v_default_room_type := p_room_types[1];
            v_room_amenities := COALESCE((p_room_type_amenities->>v_default_room_type)::jsonb, '[]'::jsonb);
        ELSE
            v_default_room_type := NULL;
            v_room_amenities := '[]'::jsonb;
        END IF;

        FOR i IN 1..p_total_rooms LOOP
            INSERT INTO public.rooms (property_id, name, status, room_type, room_amenities)
            VALUES (new_property_id, 'Room ' || i, 'available', v_default_room_type, v_room_amenities);
        END LOOP;
    END IF;

    RETURN new_property_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update update_property function to handle room_type_prices
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
    p_aadhar_url text DEFAULT NULL,
    p_pan_url text DEFAULT NULL,
    p_noc_url text DEFAULT NULL,
    p_image_url text DEFAULT NULL,
    p_images jsonb DEFAULT NULL,
    p_cancellation_policy text DEFAULT NULL,
    p_rules jsonb DEFAULT NULL,
    p_safety_items jsonb DEFAULT NULL,
    p_bedrooms integer DEFAULT NULL,
    p_beds integer DEFAULT NULL,
    p_bathrooms numeric DEFAULT NULL,
    p_max_guests integer DEFAULT NULL,
    p_area numeric DEFAULT NULL,
    p_address_line1 text DEFAULT NULL,
    p_address_line2 text DEFAULT NULL,
    p_landmark text DEFAULT NULL,
    p_district text DEFAULT NULL,
    p_city text DEFAULT NULL,
    p_state text DEFAULT NULL,
    p_postal_code text DEFAULT NULL,
    p_country text DEFAULT NULL,
    p_location text DEFAULT NULL,
    p_total_rooms integer DEFAULT NULL,
    p_check_in_time text DEFAULT NULL,
    p_check_out_time text DEFAULT NULL,
    p_latitude numeric DEFAULT NULL,
    p_longitude numeric DEFAULT NULL,
    p_room_types text[] DEFAULT NULL,
    p_room_type_amenities jsonb DEFAULT NULL,
    p_bulk_booking_discount numeric DEFAULT NULL,
    p_room_type_prices jsonb DEFAULT NULL, -- NEW PARAMETER
    p_room_type_weekend_prices jsonb DEFAULT NULL -- NEW PARAMETER
) RETURNS SETOF public.properties AS $$
DECLARE
    v_current_total_rooms integer;
    v_default_room_type text;
    v_room_amenities jsonb;
BEGIN
    -- Update the property
    UPDATE public.properties SET
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
        aadhar_url = COALESCE(p_aadhar_url, aadhar_url),
        pan_url = COALESCE(p_pan_url, pan_url),
        noc_url = COALESCE(p_noc_url, noc_url),
        image_url = COALESCE(p_image_url, image_url),
        images = COALESCE(p_images, images),
        cancellation_policy = COALESCE(p_cancellation_policy, cancellation_policy),
        rules = COALESCE(p_rules, rules),
        safety_items = COALESCE(p_safety_items, safety_items),
        bedrooms = COALESCE(p_bedrooms, bedrooms),
        beds = COALESCE(p_beds, beds),
        bathrooms = COALESCE(p_bathrooms, bathrooms),
        max_guests = COALESCE(p_max_guests, max_guests),
        area = COALESCE(p_area, area),
        address_line1 = COALESCE(p_address_line1, address_line1),
        address_line2 = COALESCE(p_address_line2, address_line2),
        landmark = COALESCE(p_landmark, landmark),
        district = COALESCE(p_district, district),
        city = COALESCE(p_city, city),
        state = COALESCE(p_state, state),
        postal_code = COALESCE(p_postal_code, postal_code),
        country = COALESCE(p_country, country),
        location = COALESCE(p_location, location),
        total_rooms = COALESCE(p_total_rooms, total_rooms),
        check_in_time = COALESCE(p_check_in_time, check_in_time),
        check_out_time = COALESCE(p_check_out_time, check_out_time),
        latitude = COALESCE(p_latitude, latitude),
        longitude = COALESCE(p_longitude, longitude),
        room_types = COALESCE(p_room_types, room_types),
        room_type_amenities = COALESCE(p_room_type_amenities, room_type_amenities),
        bulk_booking_discount = COALESCE(p_bulk_booking_discount, bulk_booking_discount),
        room_type_prices = COALESCE(p_room_type_prices, room_type_prices),
        room_type_weekend_prices = COALESCE(p_room_type_weekend_prices, room_type_weekend_prices),
        updated_at = NOW()
    WHERE id = p_id;

    -- Handle room sync if total_rooms increased
    IF p_total_rooms IS NOT NULL THEN
        SELECT COUNT(*) INTO v_current_total_rooms FROM public.rooms WHERE property_id = p_id;
        
        IF p_total_rooms > v_current_total_rooms THEN
            IF p_room_types IS NOT NULL AND array_length(p_room_types, 1) > 0 THEN
                v_default_room_type := p_room_types[1];
                v_room_amenities := COALESCE((p_room_type_amenities->>v_default_room_type)::jsonb, '[]'::jsonb);
            ELSE
                -- Try to get from existing property data
                SELECT room_types[1], (room_type_amenities->>(room_types[1]))::jsonb 
                INTO v_default_room_type, v_room_amenities
                FROM public.properties WHERE id = p_id;
            END IF;

            FOR i IN 1..(p_total_rooms - v_current_total_rooms) LOOP
                 INSERT INTO public.rooms (property_id, name, status, room_type, room_amenities)
                 VALUES (p_id, 'Room ' || (v_current_total_rooms + i), 'available', v_default_room_type, v_room_amenities);
            END LOOP;
        END IF;
    END IF;

    RETURN QUERY SELECT * FROM public.properties WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
