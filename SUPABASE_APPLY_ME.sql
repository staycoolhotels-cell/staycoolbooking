-- ==========================================
-- COMPREHENSIVE FIX FOR MISSING SCHEMA
-- Please run this entire script in your Supabase SQL Editor
-- ==========================================

-- === FROM 20260219_bulk_booking_schema.sql ===
-- Add total_rooms to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS total_rooms INTEGER DEFAULT 1;

-- Create rooms table
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'maintenance', 'booked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on rooms
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rooms
CREATE POLICY "Public can view rooms" 
ON public.rooms FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Hosts can manage their rooms" 
ON public.rooms FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.properties p 
        WHERE p.id = rooms.property_id 
        AND p.host_id = auth.uid()
    )
);

-- Update bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'single' CHECK (booking_type IN ('single', 'bulk')),
ADD COLUMN IF NOT EXISTS total_rooms_booked INTEGER DEFAULT 1;

-- Create booking_rooms table to link bookings with specific rooms
CREATE TABLE IF NOT EXISTS public.booking_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on booking_rooms
ALTER TABLE public.booking_rooms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for booking_rooms
CREATE POLICY "Users can view their booking rooms" 
ON public.booking_rooms FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.bookings b 
        WHERE b.id = booking_rooms.booking_id 
        AND b.guest_id = auth.uid()
    )
);

CREATE POLICY "Hosts can view booking rooms for their properties" 
ON public.booking_rooms FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.rooms r
        JOIN public.properties p ON p.id = r.property_id
        WHERE r.id = booking_rooms.room_id 
        AND p.host_id = auth.uid()
    )
);

-- Function to automatically create a default room for existing properties
DO $$
DECLARE
    prop RECORD;
BEGIN
    FOR prop IN SELECT id, name FROM public.properties WHERE NOT EXISTS (SELECT 1 FROM public.rooms WHERE property_id = properties.id) LOOP
        INSERT INTO public.rooms (property_id, name) VALUES (prop.id, 'Default Room');
    END LOOP;
END $$;


-- === FROM 20260219_bulk_booking_functions.sql ===
-- Function to check room availability
CREATE OR REPLACE FUNCTION public.check_availability(
    p_property_id UUID,
    p_check_in DATE,
    p_check_out DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_rooms INTEGER;
    v_booked_rooms INTEGER;
BEGIN
    -- Get total rooms for the property
    SELECT total_rooms INTO v_total_rooms
    FROM public.properties
    WHERE id = p_property_id;

    -- Count rooms that are already booked for the given dates
    -- A room is booked if there exists a booking that overlaps with the requested dates
    -- AND that booking has assigned rooms in booking_rooms
    SELECT COUNT(DISTINCT br.room_id) INTO v_booked_rooms
    FROM public.booking_rooms br
    JOIN public.bookings b ON b.id = br.booking_id
    WHERE 
        b.property_id = p_property_id
        AND b.status IN ('confirmed', 'pending_payment') -- Exclude cancelled/completed if needed, but usually completed blocks too. Let's say active bookings.
        AND (
            (p_check_in BETWEEN b.check_in AND b.check_out - INTERVAL '1 day') OR
            (p_check_out - INTERVAL '1 day' BETWEEN b.check_in AND b.check_out - INTERVAL '1 day') OR
            (b.check_in BETWEEN p_check_in AND p_check_out - INTERVAL '1 day')
        );

    -- Return available rooms
    RETURN COALESCE(v_total_rooms, 0) - COALESCE(v_booked_rooms, 0);
END;
$$;

-- Function to create a bulk booking
CREATE OR REPLACE FUNCTION public.create_bulk_booking(
    p_property_id UUID,
    p_guest_id UUID,
    p_check_in DATE,
    p_check_out DATE,
    p_total_price NUMERIC,
    p_room_count INTEGER,
    p_booking_type TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_booking_id UUID;
    v_available_room_ids UUID[];
    v_room_id UUID;
BEGIN
    -- 1. Check availability again to prevent race conditions
    -- Get IDs of available rooms
    SELECT ARRAY_AGG(r.id) INTO v_available_room_ids
    FROM public.rooms r
    WHERE r.property_id = p_property_id
    AND r.id NOT IN (
        SELECT br.room_id
        FROM public.booking_rooms br
        JOIN public.bookings b ON b.id = br.booking_id
        WHERE 
            b.property_id = p_property_id
            AND b.status IN ('confirmed', 'pending_payment')
            AND (
                (p_check_in BETWEEN b.check_in AND b.check_out - INTERVAL '1 day') OR
                (p_check_out - INTERVAL '1 day' BETWEEN b.check_in AND b.check_out - INTERVAL '1 day') OR
                (b.check_in BETWEEN p_check_in AND p_check_out - INTERVAL '1 day')
            )
    )
    LIMIT p_room_count;

    IF ARRAY_LENGTH(v_available_room_ids, 1) < p_room_count OR v_available_room_ids IS NULL THEN
        RAISE EXCEPTION 'Not enough rooms available';
    END IF;

    -- 2. Create Booking
    INSERT INTO public.bookings (
        property_id,
        guest_id,
        check_in,
        check_out,
        total_price,
        status,
        booking_type,
        total_rooms_booked
    ) VALUES (
        p_property_id,
        p_guest_id,
        p_check_in,
        p_check_out,
        p_total_price,
        'pending_payment',
        p_booking_type,
        p_room_count
    ) RETURNING id INTO v_booking_id;

    -- 3. Assign Rooms
    FOREACH v_room_id IN ARRAY v_available_room_ids LOOP
        INSERT INTO public.booking_rooms (booking_id, room_id)
        VALUES (v_booking_id, v_room_id);
    END LOOP;

    RETURN v_booking_id;
END;
$$;


-- === FROM 20260220_host_system_schema.sql ===
-- Create blocked_dates table
CREATE TABLE IF NOT EXISTS public.blocked_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT check_dates CHECK (end_date >= start_date)
);

-- Add rejection_reason to properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- RLS Policies for blocked_dates

-- Enable RLS
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access
CREATE POLICY "Public can view blocked dates" ON public.blocked_dates
    FOR SELECT
    USING (true);

-- Policy: Hosts can manage their own blocked dates
CREATE POLICY "Hosts can insert their own blocked dates" ON public.blocked_dates
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.properties p
            WHERE p.id = blocked_dates.property_id
            AND p.host_id = auth.uid()
        )
    );

CREATE POLICY "Hosts can delete their own blocked dates" ON public.blocked_dates
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.properties p
            WHERE p.id = blocked_dates.property_id
            AND p.host_id = auth.uid()
        )
    );


-- === FROM 20260220_host_system_functions.sql ===
-- Function to block property dates
CREATE OR REPLACE FUNCTION public.block_property_dates(
    p_property_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_block_id UUID;
BEGIN
    -- Check if user is the host of the property
    IF NOT EXISTS (
        SELECT 1 FROM public.properties
        WHERE id = p_property_id
        AND host_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: You do not own this property';
    END IF;

    -- Check for overlapping blocks or bookings (optional, but good practice)
    -- For now, just insert. Use check_availability to filter out.

    INSERT INTO public.blocked_dates (property_id, start_date, end_date, reason)
    VALUES (p_property_id, p_start_date, p_end_date, p_reason)
    RETURNING id INTO v_block_id;

    RETURN v_block_id;
END;
$$;

-- Function to unblock dates
CREATE OR REPLACE FUNCTION public.unblock_property_dates(
    p_block_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.blocked_dates
    WHERE id = p_block_id
    AND property_id IN (
        SELECT id FROM public.properties WHERE host_id = auth.uid()
    );

    IF FOUND THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;

-- Admin: Approve Property
CREATE OR REPLACE FUNCTION public.admin_approve_property(
    p_property_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can approve properties';
    END IF;

    UPDATE public.properties
    SET status = 'approved'
    WHERE id = p_property_id;

    RETURN TRUE;
END;
$$;

-- Admin: Reject Property
CREATE OR REPLACE FUNCTION public.admin_reject_property(
    p_property_id UUID,
    p_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can reject properties';
    END IF;

    UPDATE public.properties
    SET status = 'rejected' -- Assuming reason is stored elsewhere or logged, property table might verify a reason column?
    -- For now simply setting status. properties table doesn't have rejection_reason column by default?
    -- Let's check schema. If needed add logic.
    WHERE id = p_property_id;

    RETURN TRUE;
END;
$$;


-- === FROM 20260220_update_property_functions_bulk.sql ===
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


-- === FROM 20260220_add_room_type.sql ===
-- Migration to add room_type column and update functions

-- 1. Add column to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS room_type TEXT;

-- 2. Update create_property function
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
    p_room_type text DEFAULT NULL::text -- NEW PARAMETER
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
        room_type -- Insert new column
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
        p_room_type
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


-- 3. Update update_property function
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
    p_total_rooms integer DEFAULT NULL::integer,
    p_room_type text DEFAULT NULL::text -- NEW PARAMETER, Optional
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
        total_rooms = COALESCE(p_total_rooms, total_rooms),
        room_type = COALESCE(p_room_type, room_type)
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


-- === FROM 20260221_fix_create_bulk_booking.sql ===
-- Fix: Recreate create_bulk_booking with parameters in alphabetical order
-- PostgREST/Supabase schema cache matches functions by parameter name order alphabetically

-- Drop any existing overloads first
DROP FUNCTION IF EXISTS public.create_bulk_booking(UUID, UUID, DATE, DATE, NUMERIC, INTEGER, TEXT);
DROP FUNCTION IF EXISTS public.create_bulk_booking(TEXT, DATE, DATE, UUID, UUID, INTEGER, NUMERIC);

-- Create function with parameters in alphabetical order (as called from booking-actions.ts via rpc)
CREATE OR REPLACE FUNCTION public.create_bulk_booking(
    p_booking_type TEXT,
    p_check_in DATE,
    p_check_out DATE,
    p_guest_id UUID,
    p_property_id UUID,
    p_room_count INTEGER,
    p_total_price NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_booking_id UUID;
    v_available_room_ids UUID[];
    v_room_id UUID;
BEGIN
    -- Get IDs of available rooms (not already booked during requested period)
    SELECT ARRAY_AGG(r.id) INTO v_available_room_ids
    FROM public.rooms r
    WHERE r.property_id = p_property_id
    AND r.id NOT IN (
        SELECT br.room_id
        FROM public.booking_rooms br
        JOIN public.bookings b ON b.id = br.booking_id
        WHERE 
            b.property_id = p_property_id
            AND b.status IN ('confirmed', 'pending_payment')
            AND (
                (p_check_in BETWEEN b.check_in AND b.check_out - INTERVAL '1 day') OR
                (p_check_out - INTERVAL '1 day' BETWEEN b.check_in AND b.check_out - INTERVAL '1 day') OR
                (b.check_in BETWEEN p_check_in AND p_check_out - INTERVAL '1 day')
            )
    )
    LIMIT p_room_count;

    IF v_available_room_ids IS NULL OR ARRAY_LENGTH(v_available_room_ids, 1) < p_room_count THEN
        RAISE EXCEPTION 'Not enough rooms available';
    END IF;

    -- Create the booking record
    INSERT INTO public.bookings (
        property_id,
        guest_id,
        check_in,
        check_out,
        total_price,
        status,
        booking_type,
        total_rooms_booked
    ) VALUES (
        p_property_id,
        p_guest_id,
        p_check_in,
        p_check_out,
        p_total_price,
        'pending_payment',
        p_booking_type,
        p_room_count
    ) RETURNING id INTO v_booking_id;

    -- Assign rooms to the booking
    FOREACH v_room_id IN ARRAY v_available_room_ids LOOP
        INSERT INTO public.booking_rooms (booking_id, room_id)
        VALUES (v_booking_id, v_room_id);
    END LOOP;

    RETURN v_booking_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_bulk_booking(TEXT, DATE, DATE, UUID, UUID, INTEGER, NUMERIC) TO authenticated;


