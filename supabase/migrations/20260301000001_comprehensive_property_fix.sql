-- COMPREHENSIVE FIX FOR PROPERTIES TABLE AND FUNCTIONS
-- This script ensures all columns exist and updates the RPC functions to be consistent.

-- 1. Ensure all necessary columns exist in the properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS price_per_night NUMERIC,
ADD COLUMN IF NOT EXISTS weekend_price_per_night NUMERIC,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS tier TEXT,
ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS cancellation_policy TEXT DEFAULT 'Flexible',
ADD COLUMN IF NOT EXISTS rules TEXT[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS safety_items TEXT[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS bedrooms INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS beds INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS bathrooms NUMERIC DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_guests INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS area NUMERIC DEFAULT 500,
ADD COLUMN IF NOT EXISTS total_rooms INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS room_type TEXT,
ADD COLUMN IF NOT EXISTS host_id UUID REFERENCES auth.users(id);

-- 2. Synchronize name and title (some parts of the app use name, others use title)
UPDATE public.properties SET name = title WHERE name IS NULL AND title IS NOT NULL;
UPDATE public.properties SET title = name WHERE title IS NULL AND name IS NOT NULL;

-- 3. Update create_property function
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
    p_room_type text DEFAULT NULL::text,
    p_images jsonb DEFAULT '[]'::jsonb
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
        total_rooms,
        room_type,
        images
    )
    VALUES (
        auth.uid(),
        p_name,
        COALESCE(p_title, p_name),
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
        p_room_type,
        p_images
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

-- 4. Update update_property function
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
    p_room_type text DEFAULT NULL,
    p_images jsonb DEFAULT NULL
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
        RAISE EXCEPTION 'Access denied: You do not own this property or it does not exist';
    END IF;

    -- Get current total rooms if updating
    IF p_total_rooms IS NOT NULL THEN
        SELECT total_rooms INTO v_current_total_rooms FROM public.properties WHERE id = p_id;
    END IF;

    UPDATE public.properties
    SET
        name = COALESCE(p_name, name),
        title = COALESCE(p_title, title, p_name),
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
        room_type = COALESCE(p_room_type, room_type),
        images = COALESCE(p_images, images)
    WHERE id = p_id AND host_id = auth.uid()
    RETURNING *;

    -- Handle room creation if total_rooms increased
    IF p_total_rooms IS NOT NULL AND p_total_rooms > v_current_total_rooms THEN
        v_rooms_to_add := p_total_rooms - v_current_total_rooms;
        FOR i IN 1..v_rooms_to_add LOOP
             INSERT INTO public.rooms (property_id, name, status)
             VALUES (p_id, 'New Room ' || (v_current_total_rooms + i), 'available');
        END LOOP;
    END IF;

    RETURN QUERY SELECT * FROM public.properties WHERE id = p_id;
END;
$$;

-- 5. Diagnostic Query (Run this to verify table structure)
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'properties';
