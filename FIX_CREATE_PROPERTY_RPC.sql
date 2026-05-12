-- SQL to fix the create_property function to include all missing fields
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Drop ALL existing versions of the function to avoid "not unique" conflicts
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT oid::regprocedure as proc_name 
              FROM pg_proc 
              WHERE proname = 'create_property' 
                AND pronamespace = 'public'::regnamespace) 
    LOOP
        EXECUTE 'DROP FUNCTION ' || r.proc_name;
    END LOOP;
END $$;

-- 2. Create the comprehensive version that matches the frontend RPC call
CREATE OR REPLACE FUNCTION public.create_property(
    p_name text DEFAULT NULL,
    p_title text DEFAULT NULL,
    p_description text DEFAULT NULL,
    p_price_per_night numeric DEFAULT 0,
    p_weekend_price_per_night numeric DEFAULT 0,
    p_tier text DEFAULT NULL,
    p_amenities jsonb DEFAULT '[]'::jsonb,
    p_license_url text DEFAULT '',
    p_tax_bill_url text DEFAULT '',
    p_current_bill_url text DEFAULT '',
    p_aadhar_url text DEFAULT '',
    p_pan_url text DEFAULT '',
    p_noc_url text DEFAULT '',
    p_image_url text DEFAULT '',
    p_images jsonb DEFAULT '[]'::jsonb,
    p_cancellation_policy text DEFAULT 'Flexible',
    p_rules jsonb DEFAULT '[]'::jsonb,
    p_safety_items jsonb DEFAULT '[]'::jsonb,
    p_bedrooms integer DEFAULT 1,
    p_beds integer DEFAULT 1,
    p_bathrooms numeric DEFAULT 1,
    p_max_guests integer DEFAULT 2,
    p_area numeric DEFAULT 0,
    p_address_line1 text DEFAULT '',
    p_address_line2 text DEFAULT '',
    p_landmark text DEFAULT '',
    p_district text DEFAULT '',
    p_city text DEFAULT '',
    p_state text DEFAULT '',
    p_postal_code text DEFAULT '',
    p_country text DEFAULT 'India - IN',
    p_location text DEFAULT '',
    p_total_rooms integer DEFAULT 1,
    p_check_in_time text DEFAULT '12:00 PM',
    p_check_out_time text DEFAULT '11:00 AM',
    p_latitude numeric DEFAULT NULL,
    p_longitude numeric DEFAULT NULL
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
        address_line1,
        address_line2,
        landmark,
        district,
        city,
        state,
        postal_code,
        country,
        total_rooms,
        images,
        latitude,
        longitude,
        aadhar_url,
        pan_url,
        noc_url,
        check_in_time,
        check_out_time,
        status -- Default status
    )
    VALUES (
        auth.uid(),
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
        p_address_line1,
        p_address_line2,
        p_landmark,
        p_district,
        p_city,
        p_state,
        p_postal_code,
        p_country,
        p_total_rooms,
        p_images,
        p_latitude,
        p_longitude,
        p_aadhar_url,
        p_pan_url,
        p_noc_url,
        p_check_in_time,
        p_check_out_time,
        'pending'
    )
    RETURNING id INTO new_property_id;

    -- Automatically create individual rooms/units if applicable
    IF p_total_rooms > 0 THEN
        FOR i IN 1..p_total_rooms LOOP
            INSERT INTO public.rooms (property_id, name, status)
            VALUES (new_property_id, 'Room ' || i, 'available');
        END LOOP;
    END IF;

    RETURN new_property_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_property TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_property TO service_role;

-- Reload schema cache
NOTIFY pgrst, 'reload config';
