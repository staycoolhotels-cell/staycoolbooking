-- ============================================================================
-- UPDATE create_property & update_property RPC FUNCTIONS
-- Run this in your Supabase Dashboard → SQL Editor
-- ============================================================================
-- REASON: The frontend now sends many more parameters (aadhar_url, pan_url,
-- noc_url, images, cancellation_policy, rules, safety_items, bedrooms, etc.)
-- added in recent feature work. The old 12-parameter function signature causes
-- a total mismatch, producing the empty error: {}
-- ============================================================================

-- ============================================================================
DO $$ 
DECLARE
  v_func text;
BEGIN
  FOR v_func IN (SELECT oid::regprocedure::text FROM pg_proc WHERE proname = 'create_property' AND pronamespace = 'public'::regnamespace) 
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || v_func || ' CASCADE;';
  END LOOP;
END $$;

-- ============================================================================
-- STEP 2: Create the new create_property function with ALL parameters
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_property(
    -- Core info
    p_name                  text,
    p_title                 text,
    p_description           text,
    p_price_per_night       numeric,
    p_weekend_price_per_night numeric,
    p_tier                  text,
    -- Amenities
    p_amenities             jsonb,
    -- Documents – standard
    p_license_url           text DEFAULT '',
    p_tax_bill_url          text DEFAULT '',
    p_current_bill_url      text DEFAULT '',
    -- Documents – tent
    p_aadhar_url            text DEFAULT '',
    p_pan_url               text DEFAULT '',
    p_noc_url               text DEFAULT '',
    -- Images
    p_image_url             text DEFAULT '',
    p_images                jsonb DEFAULT '[]'::jsonb,
    -- Booking policies
    p_cancellation_policy   text DEFAULT '',
    p_rules                 jsonb DEFAULT '[]'::jsonb,
    p_safety_items          jsonb DEFAULT '[]'::jsonb,
    -- Room details
    p_bedrooms              integer DEFAULT 0,
    p_beds                  integer DEFAULT 0,
    p_bathrooms             integer DEFAULT 0,
    p_max_guests            integer DEFAULT 0,
    p_area                  numeric DEFAULT 0,
    p_total_rooms           integer DEFAULT 0,
    p_room_type             text DEFAULT '',
    -- Co-host
    p_co_host_name          text DEFAULT '',
    p_co_host_email         text DEFAULT '',
    -- Address
    p_address_line1         text DEFAULT '',
    p_address_line2         text DEFAULT '',
    p_landmark              text DEFAULT '',
    p_district              text DEFAULT '',
    p_city                  text DEFAULT '',
    p_state                 text DEFAULT '',
    p_postal_code           text DEFAULT '',
    p_country               text DEFAULT '',
    p_show_specific_location boolean DEFAULT false,
    p_location              text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
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
        aadhar_url,
        pan_url,
        noc_url,
        image_url,
        images,
        cancellation_policy,
        rules,
        safety_items,
        bedrooms,
        beds,
        bathrooms,
        max_guests,
        area,
        total_rooms,
        room_type,
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
        show_specific_location
        -- status is intentionally omitted → uses table default 'pending'
    )
    VALUES (
        auth.uid(),
        COALESCE(p_title, p_name),
        p_description,
        p_price_per_night,
        p_weekend_price_per_night,
        p_location,
        p_tier,
        COALESCE(p_amenities, '[]'::jsonb),
        COALESCE(p_license_url, ''),
        COALESCE(p_tax_bill_url, ''),
        COALESCE(p_current_bill_url, ''),
        COALESCE(p_aadhar_url, ''),
        COALESCE(p_pan_url, ''),
        COALESCE(p_noc_url, ''),
        COALESCE(p_image_url, ''),
        COALESCE(p_images, '[]'::jsonb),
        COALESCE(p_cancellation_policy, ''),
        COALESCE(p_rules, '[]'::jsonb),
        COALESCE(p_safety_items, '[]'::jsonb),
        COALESCE(p_bedrooms, 0),
        COALESCE(p_beds, 0),
        COALESCE(p_bathrooms, 0),
        COALESCE(p_max_guests, 0),
        COALESCE(p_area, 0),
        COALESCE(p_total_rooms, 0),
        COALESCE(p_room_type, ''),
        COALESCE(p_co_host_name, ''),
        COALESCE(p_co_host_email, ''),
        COALESCE(p_address_line1, ''),
        COALESCE(p_address_line2, ''),
        COALESCE(p_landmark, ''),
        COALESCE(p_district, ''),
        COALESCE(p_city, ''),
        COALESCE(p_state, ''),
        COALESCE(p_postal_code, ''),
        COALESCE(p_country, ''),
        COALESCE(p_show_specific_location, false)
    )
    RETURNING id INTO new_property_id;

    RETURN new_property_id;
END;
$$;

-- ============================================================================
-- STEP 3: Grant permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.create_property TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_property TO service_role;

-- ============================================================================
-- STEP 4: Also update update_property if it is missing the new columns.
-- Only run the block below if your update_property function also errors.
-- ============================================================================

DO $$ 
DECLARE
  v_func text;
BEGIN
  FOR v_func IN (SELECT oid::regprocedure::text FROM pg_proc WHERE proname = 'update_property' AND pronamespace = 'public'::regnamespace) 
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || v_func || ' CASCADE;';
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.update_property(
    p_id                    uuid,
    p_name                  text,
    p_title                 text,
    p_description           text,
    p_price_per_night       numeric,
    p_weekend_price_per_night numeric,
    p_tier                  text,
    p_amenities             jsonb,
    p_license_url           text DEFAULT '',
    p_tax_bill_url          text DEFAULT '',
    p_current_bill_url      text DEFAULT '',
    p_aadhar_url            text DEFAULT '',
    p_pan_url               text DEFAULT '',
    p_noc_url               text DEFAULT '',
    p_image_url             text DEFAULT '',
    p_images                jsonb DEFAULT '[]'::jsonb,
    p_cancellation_policy   text DEFAULT '',
    p_rules                 jsonb DEFAULT '[]'::jsonb,
    p_safety_items          jsonb DEFAULT '[]'::jsonb,
    p_bedrooms              integer DEFAULT 0,
    p_beds                  integer DEFAULT 0,
    p_bathrooms             integer DEFAULT 0,
    p_max_guests            integer DEFAULT 0,
    p_area                  numeric DEFAULT 0,
    p_total_rooms           integer DEFAULT 0,
    p_room_type             text DEFAULT '',
    p_co_host_name          text DEFAULT '',
    p_co_host_email         text DEFAULT '',
    p_address_line1         text DEFAULT '',
    p_address_line2         text DEFAULT '',
    p_landmark              text DEFAULT '',
    p_district              text DEFAULT '',
    p_city                  text DEFAULT '',
    p_state                 text DEFAULT '',
    p_postal_code           text DEFAULT '',
    p_country               text DEFAULT '',
    p_show_specific_location boolean DEFAULT false,
    p_location              text DEFAULT ''
)
RETURNS SETOF public.properties
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    RETURN QUERY
    UPDATE public.properties
    SET
        title                 = COALESCE(p_title, p_name),
        description           = p_description,
        price_per_night       = p_price_per_night,
        weekend_price_per_night = p_weekend_price_per_night,
        location              = p_location,
        tier                  = p_tier,
        amenities             = COALESCE(p_amenities, '[]'::jsonb),
        license_url           = COALESCE(p_license_url, ''),
        tax_bill_url          = COALESCE(p_tax_bill_url, ''),
        current_bill_url      = COALESCE(p_current_bill_url, ''),
        aadhar_url            = COALESCE(p_aadhar_url, ''),
        pan_url               = COALESCE(p_pan_url, ''),
        noc_url               = COALESCE(p_noc_url, ''),
        image_url             = COALESCE(p_image_url, ''),
        images                = COALESCE(p_images, '[]'::jsonb),
        cancellation_policy   = COALESCE(p_cancellation_policy, ''),
        rules                 = COALESCE(p_rules, '[]'::jsonb),
        safety_items          = COALESCE(p_safety_items, '[]'::jsonb),
        bedrooms              = COALESCE(p_bedrooms, 0),
        beds                  = COALESCE(p_beds, 0),
        bathrooms             = COALESCE(p_bathrooms, 0),
        max_guests            = COALESCE(p_max_guests, 0),
        area                  = COALESCE(p_area, 0),
        total_rooms           = COALESCE(p_total_rooms, 0),
        room_type             = COALESCE(p_room_type, ''),
        co_host_name          = COALESCE(p_co_host_name, ''),
        co_host_email         = COALESCE(p_co_host_email, ''),
        address_line1         = COALESCE(p_address_line1, ''),
        address_line2         = COALESCE(p_address_line2, ''),
        landmark              = COALESCE(p_landmark, ''),
        district              = COALESCE(p_district, ''),
        city                  = COALESCE(p_city, ''),
        state                 = COALESCE(p_state, ''),
        postal_code           = COALESCE(p_postal_code, ''),
        country               = COALESCE(p_country, ''),
        show_specific_location = COALESCE(p_show_specific_location, false),
        updated_at            = now()
    WHERE id = p_id
      AND host_id = auth.uid()
    RETURNING *;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_property TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_property TO service_role;

-- ============================================================================
-- STEP 5: Add any missing columns to the properties table (safe – uses IF NOT EXISTS)
-- ============================================================================
ALTER TABLE public.properties
    ADD COLUMN IF NOT EXISTS aadhar_url            text DEFAULT '',
    ADD COLUMN IF NOT EXISTS pan_url               text DEFAULT '',
    ADD COLUMN IF NOT EXISTS noc_url               text DEFAULT '',
    ADD COLUMN IF NOT EXISTS images                jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS cancellation_policy   text DEFAULT '',
    ADD COLUMN IF NOT EXISTS rules                 jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS safety_items          jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS beds                  integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_rooms           integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS room_type             text DEFAULT '',
    ADD COLUMN IF NOT EXISTS co_host_name          text DEFAULT '',
    ADD COLUMN IF NOT EXISTS co_host_email         text DEFAULT '',
    ADD COLUMN IF NOT EXISTS address_line1         text DEFAULT '',
    ADD COLUMN IF NOT EXISTS address_line2         text DEFAULT '',
    ADD COLUMN IF NOT EXISTS landmark              text DEFAULT '',
    ADD COLUMN IF NOT EXISTS district              text DEFAULT '',
    ADD COLUMN IF NOT EXISTS city                  text DEFAULT '',
    ADD COLUMN IF NOT EXISTS state                 text DEFAULT '',
    ADD COLUMN IF NOT EXISTS postal_code           text DEFAULT '',
    ADD COLUMN IF NOT EXISTS country               text DEFAULT '',
    ADD COLUMN IF NOT EXISTS show_specific_location boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS updated_at            timestamptz DEFAULT now();

-- ============================================================================
-- STEP 6: Reload PostgREST schema cache
-- ============================================================================
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- STEP 7: Verify
-- ============================================================================
SELECT
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('create_property', 'update_property')
ORDER BY p.proname;
