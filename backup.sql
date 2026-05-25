


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "staycoolbooking";


ALTER SCHEMA "staycoolbooking" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "hypopg" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "index_advisor" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."stay_category" AS ENUM (
    'Hotel',
    'Home Stay',
    'Tent',
    'Wooden Stay',
    'Dormitory',
    'Apartment',
    'Resort'
);


ALTER TYPE "public"."stay_category" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_approve_property"("p_property_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."admin_approve_property"("p_property_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_reject_property"("p_property_id" "uuid", "p_reason" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."admin_reject_property"("p_property_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."block_property_dates"("p_property_id" "uuid", "p_start_date" "date", "p_end_date" "date", "p_reason" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."block_property_dates"("p_property_id" "uuid", "p_start_date" "date", "p_end_date" "date", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_availability"("p_property_id" "uuid", "p_check_in" "date", "p_check_out" "date") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_available_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_available_count
    FROM public.get_available_rooms(p_property_id, p_check_in, p_check_out)
    WHERE is_available = true;
    
    RETURN v_available_count;
END;
$$;


ALTER FUNCTION "public"."check_availability"("p_property_id" "uuid", "p_check_in" "date", "p_check_out" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_booking_with_rooms"("p_booking_type" "text", "p_check_in" "date", "p_check_out" "date", "p_guest_id" "uuid", "p_property_id" "uuid", "p_room_ids" "uuid"[], "p_total_price" numeric, "p_has_free_cancellation" boolean DEFAULT false, "p_free_cancellation_fee" numeric DEFAULT 0, "p_bulk_booking_discount" numeric DEFAULT NULL::numeric) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    new_booking_id uuid;
    room_id uuid;
BEGIN
    -- Create the booking record
    INSERT INTO public.bookings (
        guest_id,
        property_id,
        check_in,
        check_out,
        total_price,
        status,
        booking_type,
        total_rooms_booked,
        has_free_cancellation,
        free_cancellation_fee,
        bulk_booking_discount -- NEW COLUMN
    )
    VALUES (
        p_guest_id,
        p_property_id,
        p_check_in,
        p_check_out,
        p_total_price,
        'pending_payment',
        p_booking_type,
        ARRAY_LENGTH(p_room_ids, 1),
        p_has_free_cancellation,
        p_free_cancellation_fee,
        p_bulk_booking_discount -- NEW VALUE
    )
    RETURNING id INTO new_booking_id;

    -- Assign rooms
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_rooms' AND table_schema = 'public') THEN
        FOREACH room_id IN ARRAY p_room_ids
        LOOP
            INSERT INTO public.booking_rooms (booking_id, room_id)
            VALUES (new_booking_id, room_id);
        END LOOP;
    END IF;

    RETURN new_booking_id;
END;
$$;


ALTER FUNCTION "public"."create_booking_with_rooms"("p_booking_type" "text", "p_check_in" "date", "p_check_out" "date", "p_guest_id" "uuid", "p_property_id" "uuid", "p_room_ids" "uuid"[], "p_total_price" numeric, "p_has_free_cancellation" boolean, "p_free_cancellation_fee" numeric, "p_bulk_booking_discount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_bulk_booking"("p_booking_type" "text", "p_check_in" "date", "p_check_out" "date", "p_guest_id" "uuid", "p_property_id" "uuid", "p_room_count" integer, "p_total_price" numeric, "p_has_free_cancellation" boolean DEFAULT false, "p_free_cancellation_fee" numeric DEFAULT 0, "p_bulk_booking_discount" numeric DEFAULT NULL::numeric) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    new_booking_id uuid;
    v_available_room_ids uuid[];
    v_room_id uuid;
BEGIN
    -- 1. Find available rooms
    SELECT ARRAY_AGG(r.id) INTO v_available_room_ids
    FROM (
        SELECT id FROM public.rooms
        WHERE property_id = p_property_id
        AND id NOT IN (
            SELECT br.room_id FROM public.booking_rooms br
            JOIN public.bookings b ON b.id = br.booking_id
            WHERE b.property_id = p_property_id
              AND b.status IN ('confirmed', 'pending_payment')
              AND (
                  (p_check_in BETWEEN b.check_in AND b.check_out - INTERVAL '1 day') OR
                  (p_check_out - INTERVAL '1 day' BETWEEN b.check_in AND b.check_out - INTERVAL '1 day') OR
                  (b.check_in BETWEEN p_check_in AND p_check_out - INTERVAL '1 day')
              )
        )
        LIMIT p_room_count
    ) r;

    IF v_available_room_ids IS NULL OR ARRAY_LENGTH(v_available_room_ids, 1) < p_room_count THEN
        RAISE EXCEPTION 'Not enough rooms available';
    END IF;

    -- 2. Create the booking record
    INSERT INTO public.bookings (
        guest_id,
        property_id,
        check_in,
        check_out,
        total_price,
        status,
        booking_type,
        total_rooms_booked,
        has_free_cancellation,
        free_cancellation_fee,
        bulk_booking_discount -- NEW COLUMN
    )
    VALUES (
        p_guest_id,
        p_property_id,
        p_check_in,
        p_check_out,
        p_total_price,
        'pending_payment',
        p_booking_type,
        p_room_count,
        p_has_free_cancellation,
        p_free_cancellation_fee,
        p_bulk_booking_discount -- NEW VALUE
    )
    RETURNING id INTO new_booking_id;

    -- 3. Assign Rooms
    FOREACH v_room_id IN ARRAY v_available_room_ids LOOP
        INSERT INTO public.booking_rooms (booking_id, room_id)
        VALUES (new_booking_id, v_room_id);
    END LOOP;

    RETURN new_booking_id;
END;
$$;


ALTER FUNCTION "public"."create_bulk_booking"("p_booking_type" "text", "p_check_in" "date", "p_check_out" "date", "p_guest_id" "uuid", "p_property_id" "uuid", "p_room_count" integer, "p_total_price" numeric, "p_has_free_cancellation" boolean, "p_free_cancellation_fee" numeric, "p_bulk_booking_discount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_property"("p_name" "text", "p_title" "text", "p_description" "text", "p_price_per_night" numeric, "p_weekend_price_per_night" numeric, "p_location" "text", "p_tier" "text", "p_amenities" "jsonb", "p_license_url" "text", "p_tax_bill_url" "text", "p_current_bill_url" "text", "p_image_url" "text", "p_cancellation_policy" "text" DEFAULT 'Flexible'::"text", "p_rules" "text"[] DEFAULT ARRAY[]::"text"[], "p_safety_items" "text"[] DEFAULT ARRAY[]::"text"[], "p_bedrooms" integer DEFAULT 1, "p_beds" integer DEFAULT 1, "p_bathrooms" numeric DEFAULT 1, "p_max_guests" integer DEFAULT 2, "p_area" numeric DEFAULT 500, "p_co_host_name" "text" DEFAULT NULL::"text", "p_co_host_email" "text" DEFAULT NULL::"text", "p_address_line1" "text" DEFAULT NULL::"text", "p_address_line2" "text" DEFAULT NULL::"text", "p_landmark" "text" DEFAULT NULL::"text", "p_district" "text" DEFAULT NULL::"text", "p_city" "text" DEFAULT NULL::"text", "p_state" "text" DEFAULT NULL::"text", "p_postal_code" "text" DEFAULT NULL::"text", "p_country" "text" DEFAULT 'India - IN'::"text", "p_show_specific_location" boolean DEFAULT false, "p_total_rooms" integer DEFAULT 1, "p_room_type" "text" DEFAULT NULL::"text", "p_check_in_time" "text" DEFAULT NULL::"text", "p_check_out_time" "text" DEFAULT NULL::"text", "p_bulk_booking_discount" numeric DEFAULT 10) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
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
        check_in_time,
        check_out_time,
        bulk_booking_discount
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
        p_room_type,
        p_check_in_time,
        p_check_out_time,
        p_bulk_booking_discount
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


ALTER FUNCTION "public"."create_property"("p_name" "text", "p_title" "text", "p_description" "text", "p_price_per_night" numeric, "p_weekend_price_per_night" numeric, "p_location" "text", "p_tier" "text", "p_amenities" "jsonb", "p_license_url" "text", "p_tax_bill_url" "text", "p_current_bill_url" "text", "p_image_url" "text", "p_cancellation_policy" "text", "p_rules" "text"[], "p_safety_items" "text"[], "p_bedrooms" integer, "p_beds" integer, "p_bathrooms" numeric, "p_max_guests" integer, "p_area" numeric, "p_co_host_name" "text", "p_co_host_email" "text", "p_address_line1" "text", "p_address_line2" "text", "p_landmark" "text", "p_district" "text", "p_city" "text", "p_state" "text", "p_postal_code" "text", "p_country" "text", "p_show_specific_location" boolean, "p_total_rooms" integer, "p_room_type" "text", "p_check_in_time" "text", "p_check_out_time" "text", "p_bulk_booking_discount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_property"("p_name" "text" DEFAULT NULL::"text", "p_title" "text" DEFAULT NULL::"text", "p_description" "text" DEFAULT NULL::"text", "p_price_per_night" numeric DEFAULT 0, "p_weekend_price_per_night" numeric DEFAULT 0, "p_tier" "text" DEFAULT NULL::"text", "p_amenities" "jsonb" DEFAULT '[]'::"jsonb", "p_license_url" "text" DEFAULT ''::"text", "p_tax_bill_url" "text" DEFAULT ''::"text", "p_current_bill_url" "text" DEFAULT ''::"text", "p_aadhar_url" "text" DEFAULT ''::"text", "p_pan_url" "text" DEFAULT ''::"text", "p_noc_url" "text" DEFAULT ''::"text", "p_image_url" "text" DEFAULT ''::"text", "p_images" "jsonb" DEFAULT '[]'::"jsonb", "p_cancellation_policy" "text" DEFAULT 'Flexible'::"text", "p_rules" "jsonb" DEFAULT '[]'::"jsonb", "p_safety_items" "jsonb" DEFAULT '[]'::"jsonb", "p_bedrooms" integer DEFAULT 1, "p_beds" integer DEFAULT 1, "p_bathrooms" numeric DEFAULT 1, "p_max_guests" integer DEFAULT 2, "p_area" numeric DEFAULT 0, "p_address_line1" "text" DEFAULT ''::"text", "p_address_line2" "text" DEFAULT ''::"text", "p_landmark" "text" DEFAULT ''::"text", "p_district" "text" DEFAULT ''::"text", "p_city" "text" DEFAULT ''::"text", "p_state" "text" DEFAULT ''::"text", "p_postal_code" "text" DEFAULT ''::"text", "p_country" "text" DEFAULT 'India - IN'::"text", "p_location" "text" DEFAULT ''::"text", "p_total_rooms" integer DEFAULT 1, "p_check_in_time" "text" DEFAULT '12:00 PM'::"text", "p_check_out_time" "text" DEFAULT '11:00 AM'::"text", "p_latitude" numeric DEFAULT NULL::numeric, "p_longitude" numeric DEFAULT NULL::numeric) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."create_property"("p_name" "text", "p_title" "text", "p_description" "text", "p_price_per_night" numeric, "p_weekend_price_per_night" numeric, "p_tier" "text", "p_amenities" "jsonb", "p_license_url" "text", "p_tax_bill_url" "text", "p_current_bill_url" "text", "p_aadhar_url" "text", "p_pan_url" "text", "p_noc_url" "text", "p_image_url" "text", "p_images" "jsonb", "p_cancellation_policy" "text", "p_rules" "jsonb", "p_safety_items" "jsonb", "p_bedrooms" integer, "p_beds" integer, "p_bathrooms" numeric, "p_max_guests" integer, "p_area" numeric, "p_address_line1" "text", "p_address_line2" "text", "p_landmark" "text", "p_district" "text", "p_city" "text", "p_state" "text", "p_postal_code" "text", "p_country" "text", "p_location" "text", "p_total_rooms" integer, "p_check_in_time" "text", "p_check_out_time" "text", "p_latitude" numeric, "p_longitude" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_referral_benefit"("p_host_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.users 
  SET referral_benefit_count = GREATEST(0, referral_benefit_count - 1)
  WHERE id = p_host_id;
END;
$$;


ALTER FUNCTION "public"."decrement_referral_benefit"("p_host_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_available_rooms"("p_property_id" "uuid", "p_check_in" "date", "p_check_out" "date") RETURNS TABLE("id" "uuid", "property_id" "uuid", "name" "text", "status" "text", "is_available" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY SELECT r.id, r.property_id, r.name, r.status,
    (r.status = 'available' AND NOT EXISTS (
        SELECT 1 FROM public.booking_rooms br JOIN public.bookings b ON b.id = br.booking_id
        WHERE br.room_id = r.id AND b.status IN ('confirmed', 'pending_payment')
        AND (p_check_in < b.check_out AND p_check_out > b.check_in)
    )) as is_available
    FROM public.rooms r WHERE r.property_id = p_property_id;
END;
$$;


ALTER FUNCTION "public"."get_available_rooms"("p_property_id" "uuid", "p_check_in" "date", "p_check_out" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_commission_for_booking"("p_property_id" "uuid", "p_total_price" numeric) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_host_id UUID;
    v_rule RECORD;
    v_total_commission NUMERIC;
    v_admin_commission NUMERIC;
    v_referrer_commission NUMERIC := 0;
    v_type TEXT;
    v_value NUMERIC;
    v_referrer_id UUID;
    v_commissions_remaining INTEGER;
BEGIN
    -- Get host_id for the property
    SELECT host_id INTO v_host_id
    FROM public.properties
    WHERE id = p_property_id;

    -- Get referral info for the host
    SELECT referred_by, referral_commissions_remaining 
    INTO v_referrer_id, v_commissions_remaining
    FROM public.users
    WHERE id = v_host_id;

    -- 1. Look for a property-level rule first
    SELECT commission_type, commission_value INTO v_rule
    FROM public.commission_rules
    WHERE property_id = p_property_id AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1;

    IF FOUND THEN
        v_type := v_rule.commission_type;
        v_value := v_rule.commission_value;
    ELSE
        -- 2. Fall back to host-level rule
        SELECT commission_type, commission_value INTO v_rule
        FROM public.commission_rules
        WHERE host_id = v_host_id AND property_id IS NULL AND is_active = true
        ORDER BY created_at DESC
        LIMIT 1;

        IF FOUND THEN
            v_type := v_rule.commission_type;
            v_value := v_rule.commission_value;
        ELSE
            -- 3. Platform default: 20% of total price
            v_type := 'percentage';
            v_value := 20;
        END IF;
    END IF;

    -- Calculate TOTAL commission amount
    IF v_type = 'percentage' THEN
        v_total_commission := ROUND((p_total_price * v_value / 100)::NUMERIC, 2);
    ELSE
        v_total_commission := LEAST(v_value, p_total_price); -- fixed, but never exceeds total
    END IF;

    -- Handle Referrer Split (5% to Referrer, rest to Admin)
    -- Only if Host 2 was referred and has remaining referral bookings
    IF v_referrer_id IS NOT NULL AND v_commissions_remaining > 0 THEN
        -- Calculate 5% for referrer
        v_referrer_commission := ROUND((p_total_price * 0.05)::NUMERIC, 2);
        
        -- Admin gets the rest of the total commission
        -- If total commission is less than 5% (unlikely but possible with custom rules), 
        -- referrer gets it all and admin gets 0? Or split differently?
        -- User said: "20% lo nunchi 5% host 1 ki... migitha 15% admin deggare undali".
        -- This implies a 25/75 split of the 20% commission.
        -- Let's just subtract 5% from total price for referrer, and the rest of the commission goes to Admin.
        v_admin_commission := GREATEST(0, v_total_commission - v_referrer_commission);
    ELSE
        v_admin_commission := v_total_commission;
        v_referrer_commission := 0;
    END IF;

    RETURN jsonb_build_object(
        'total_commission_amount', v_total_commission,
        'admin_commission_amount', v_admin_commission,
        'referrer_commission_amount', v_referrer_commission,
        'referrer_id', v_referrer_id,
        'host_amount', ROUND((p_total_price - v_total_commission)::NUMERIC, 2),
        'commission_type', v_type,
        'commission_value', v_value
    );
END;
$$;


ALTER FUNCTION "public"."get_commission_for_booking"("p_property_id" "uuid", "p_total_price" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_property_rooms_availability"("p_property_id" "uuid", "p_check_in" "date", "p_check_out" "date") RETURNS TABLE("id" "uuid", "room_number" "text", "is_available" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.room_number,
    NOT EXISTS (
      SELECT 1 
      FROM public.bookings b
      WHERE b.room_id = r.id
        AND b.status IN ('pending', 'confirmed')
        AND b.check_in::date < p_check_out 
        AND b.check_out::date > p_check_in
    ) AS is_available
  FROM public.rooms r
  WHERE r.property_id = p_property_id
  ORDER BY r.room_number ASC;
END;
$$;


ALTER FUNCTION "public"."get_property_rooms_availability"("p_property_id" "uuid", "p_check_in" "date", "p_check_out" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_rooms_realtime_status"("p_property_id" "uuid") RETURNS TABLE("id" "uuid", "name" "text", "status" "text", "current_guest" "text", "booking_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
#variable_conflict use_column
DECLARE
    v_check_out_time_str TEXT;
    v_check_out_time TIME;
    v_current_time TIME;
    v_current_date DATE;
BEGIN
    SELECT check_out_time INTO v_check_out_time_str FROM public.properties WHERE properties.id = p_property_id;
    
    BEGIN
        IF v_check_out_time_str IS NOT NULL THEN
            v_check_out_time := CAST(v_check_out_time_str AS TIME);
        ELSE
            v_check_out_time := TIME '11:00:00';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_check_out_time := TIME '11:00:00';
    END;

    v_current_time := CURRENT_TIME;
    v_current_date := CURRENT_DATE;

    RETURN QUERY
    SELECT 
        r.id,
        r.name,
        CASE 
            WHEN r.status = 'maintenance' THEN 'maintenance'
            WHEN EXISTS (
                SELECT 1 FROM public.booking_rooms br
                JOIN public.bookings b ON b.id = br.booking_id
                WHERE br.room_id = r.id
                AND b.status IN ('confirmed', 'pending_payment')
                AND (
                    (b.check_in <= v_current_date AND b.check_out > v_current_date)
                    OR
                    (b.check_out = v_current_date AND v_current_time < v_check_out_time)
                )
            ) THEN 'booked'
            ELSE 'available'
        END as status,
        (
            SELECT u.name FROM public.bookings b
            JOIN public.booking_rooms br ON br.booking_id = b.id
            JOIN public.users u ON u.id = b.guest_id
            WHERE br.room_id = r.id
            AND b.status IN ('confirmed', 'pending_payment')
            AND (
                (b.check_in <= v_current_date AND b.check_out > v_current_date)
                OR
                (b.check_out = v_current_date AND v_current_time < v_check_out_time)
            )
            LIMIT 1
        ) as current_guest,
        (
            SELECT b.id FROM public.bookings b
            JOIN public.booking_rooms br ON br.booking_id = b.id
            WHERE br.room_id = r.id
            AND b.status IN ('confirmed', 'pending_payment')
            AND (
                (b.check_in <= v_current_date AND b.check_out > v_current_date)
                OR
                (b.check_out = v_current_date AND v_current_time < v_check_out_time)
            )
            LIMIT 1
        ) as booking_id
    FROM public.rooms r
    WHERE r.property_id = p_property_id;
END;
$$;


ALTER FUNCTION "public"."get_rooms_realtime_status"("p_property_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_role TEXT;
  user_status TEXT;
BEGIN
  user_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'guest'));

  -- Set status based on role
  IF user_role = 'host' THEN
    user_status := 'pending';
  ELSIF user_role = 'admin' THEN
    user_status := 'active';
  ELSE
    user_status := 'active'; -- guests
  END IF;

  INSERT INTO public.users (id, name, email, role, status, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    user_role,
    user_status,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    avatar_url = EXCLUDED.avatar_url;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role, reward_points, created_at)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    'guest',
    0,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_user_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_role text;
  v_status text;
  v_referral_code text;
BEGIN
  -- Determine Role
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'guest');
  v_role := lower(v_role);

  -- Determine Status based on Role, but respect metadata if present
  IF v_role = 'host' THEN
    v_status := COALESCE(NEW.raw_user_meta_data->>'status', 'pending');
  ELSE
    v_status := 'active';
  END IF;

  -- Generate a potential referral code
  v_referral_code := 'SC-' || upper(substring(md5(NEW.id::text || random()::text), 1, 6));

  INSERT INTO public.users (id, name, email, avatar_url, role, status, referral_code)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'name', 
    NEW.email, 
    NEW.raw_user_meta_data->>'avatar_url', 
    v_role,
    v_status,
    v_referral_code
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    avatar_url = EXCLUDED.avatar_url,
    role = v_role,
    status = CASE 
      WHEN public.users.status IN ('active', 'approved', 'rejected', 'suspended', 'approved_host') THEN public.users.status 
      ELSE v_status 
    END,
    referral_code = COALESCE(public.users.referral_code, EXCLUDED.referral_code);

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_user_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."toggle_property_status"("p_id" "uuid", "p_status" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_current_status TEXT;
  v_host_id UUID;
  v_kyc_status TEXT;
BEGIN
  -- Get current status and host
  SELECT status, host_id INTO v_current_status, v_host_id
  FROM public.properties
  WHERE id = p_id;

  -- Verify ownership
  IF v_host_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- If transition is to 'active' (making it live), verify that KYC setup is completed and status is 'activated'
  IF p_status = 'active' THEN
    SELECT kyc_status INTO v_kyc_status
    FROM public.host_kyc_details
    WHERE user_id = v_host_id;

    IF v_kyc_status IS NULL OR v_kyc_status != 'activated' THEN
      RAISE EXCEPTION 'Banking & KYC setup must be Active & Verified before taking a property live. Current KYC status: %', COALESCE(v_kyc_status, 'pending');
    END IF;
  END IF;

  -- Logic
  IF p_status = 'offline' THEN
    -- Can take active to offline
    IF v_current_status = 'active' THEN
      UPDATE public.properties SET status = 'offline' WHERE id = p_id;
    ELSIF v_current_status = 'offline' THEN
      -- Already offline, do nothing
      RETURN;
    ELSE
      RAISE EXCEPTION 'Only active properties can be taken offline. Current status: %', v_current_status;
    END IF;
  ELSIF p_status = 'active' THEN
    -- Can take offline to active
    IF v_current_status = 'offline' THEN
      UPDATE public.properties SET status = 'active' WHERE id = p_id;
    ELSIF v_current_status = 'active' THEN
      -- Already active, do nothing
      RETURN;
    ELSE
      RAISE EXCEPTION 'Only offline properties can be reactivated directly. Pending properties must be approved by admin. Current status: %', v_current_status;
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid status transition to %', p_status;
  END IF;
END;
$$;


ALTER FUNCTION "public"."toggle_property_status"("p_id" "uuid", "p_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."unblock_property_dates"("p_block_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."unblock_property_dates"("p_block_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_post_likes_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.community_posts
        SET likes_count = likes_count + 1
        WHERE id = NEW.post_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.community_posts
        SET likes_count = likes_count - 1
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_post_likes_count"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."properties" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "host_id" "uuid" DEFAULT "auth"."uid"(),
    "title" "text" NOT NULL,
    "description" "text",
    "price_per_night" numeric(10,2) NOT NULL,
    "image_url" "text",
    "location" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "amenities" "jsonb",
    "license_url" "text",
    "tax_bill_url" "text",
    "current_bill_url" "text",
    "weekend_price_per_night" numeric,
    "tier" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "capacity" integer,
    "bathrooms" integer,
    "max_guests" integer,
    "cancellationPolicy" "text",
    "rules" "jsonb",
    "images" "jsonb",
    "rejection_reason" "text",
    "co_host_name" "text",
    "co_host_email" "text",
    "address_line1" "text",
    "address_line2" "text",
    "landmark" "text",
    "district" "text",
    "city" "text",
    "state" "text",
    "postal_code" "text",
    "country" "text" DEFAULT 'India - IN'::"text",
    "show_specific_location" boolean DEFAULT false,
    "beds" numeric DEFAULT 0,
    "cancellation_policy" "text",
    "safety_items" "jsonb" DEFAULT '[]'::"jsonb",
    "bedrooms" numeric DEFAULT 0,
    "area" numeric DEFAULT 0,
    "total_rooms" integer DEFAULT 1,
    "room_type" "text",
    "aadhar_url" "text" DEFAULT ''::"text",
    "pan_url" "text" DEFAULT ''::"text",
    "noc_url" "text" DEFAULT ''::"text",
    "latitude" double precision,
    "longitude" double precision,
    "check_in_time" "text",
    "check_out_time" "text",
    "bulk_booking_discount" numeric DEFAULT 10,
    CONSTRAINT "properties_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'rejected'::"text", 'offline'::"text"])))
);


ALTER TABLE "public"."properties" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_property"("p_id" "uuid", "p_name" "text" DEFAULT NULL::"text", "p_title" "text" DEFAULT NULL::"text", "p_description" "text" DEFAULT NULL::"text", "p_price_per_night" numeric DEFAULT NULL::numeric, "p_weekend_price_per_night" numeric DEFAULT NULL::numeric, "p_tier" "text" DEFAULT NULL::"text", "p_amenities" "jsonb" DEFAULT NULL::"jsonb", "p_license_url" "text" DEFAULT NULL::"text", "p_tax_bill_url" "text" DEFAULT NULL::"text", "p_current_bill_url" "text" DEFAULT NULL::"text", "p_image_url" "text" DEFAULT NULL::"text", "p_cancellation_policy" "text" DEFAULT NULL::"text", "p_rules" "text"[] DEFAULT NULL::"text"[], "p_safety_items" "text"[] DEFAULT NULL::"text"[], "p_bedrooms" integer DEFAULT NULL::integer, "p_beds" integer DEFAULT NULL::integer, "p_bathrooms" numeric DEFAULT NULL::numeric, "p_max_guests" integer DEFAULT NULL::integer, "p_area" numeric DEFAULT NULL::numeric, "p_co_host_name" "text" DEFAULT NULL::"text", "p_co_host_email" "text" DEFAULT NULL::"text", "p_address_line1" "text" DEFAULT NULL::"text", "p_address_line2" "text" DEFAULT NULL::"text", "p_landmark" "text" DEFAULT NULL::"text", "p_district" "text" DEFAULT NULL::"text", "p_city" "text" DEFAULT NULL::"text", "p_state" "text" DEFAULT NULL::"text", "p_postal_code" "text" DEFAULT NULL::"text", "p_country" "text" DEFAULT NULL::"text", "p_show_specific_location" boolean DEFAULT NULL::boolean, "p_location" "text" DEFAULT NULL::"text", "p_total_rooms" integer DEFAULT NULL::integer, "p_room_type" "text" DEFAULT NULL::"text", "p_check_in_time" "text" DEFAULT NULL::"text", "p_check_out_time" "text" DEFAULT NULL::"text") RETURNS SETOF "public"."properties"
    LANGUAGE "plpgsql" SECURITY DEFINER
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
        room_type = COALESCE(p_room_type, room_type),
        check_in_time = COALESCE(p_check_in_time, check_in_time),
        check_out_time = COALESCE(p_check_out_time, check_out_time)
    WHERE id = p_id AND host_id = auth.uid()
    RETURNING *;

    -- Handle room creation if total_rooms increased
    IF p_total_rooms IS NOT NULL AND p_total_rooms > COALESCE(v_current_total_rooms, 0) THEN
        v_rooms_to_add := p_total_rooms - COALESCE(v_current_total_rooms, 0);
        FOR i IN 1..v_rooms_to_add LOOP
             INSERT INTO public.rooms (property_id, name, status)
             VALUES (p_id, 'New Room ' || (COALESCE(v_current_total_rooms, 0) + i), 'available');
        END LOOP;
    END IF;

    RETURN QUERY SELECT * FROM public.properties WHERE id = p_id;
END;
$$;


ALTER FUNCTION "public"."update_property"("p_id" "uuid", "p_name" "text", "p_title" "text", "p_description" "text", "p_price_per_night" numeric, "p_weekend_price_per_night" numeric, "p_tier" "text", "p_amenities" "jsonb", "p_license_url" "text", "p_tax_bill_url" "text", "p_current_bill_url" "text", "p_image_url" "text", "p_cancellation_policy" "text", "p_rules" "text"[], "p_safety_items" "text"[], "p_bedrooms" integer, "p_beds" integer, "p_bathrooms" numeric, "p_max_guests" integer, "p_area" numeric, "p_co_host_name" "text", "p_co_host_email" "text", "p_address_line1" "text", "p_address_line2" "text", "p_landmark" "text", "p_district" "text", "p_city" "text", "p_state" "text", "p_postal_code" "text", "p_country" "text", "p_show_specific_location" boolean, "p_location" "text", "p_total_rooms" integer, "p_room_type" "text", "p_check_in_time" "text", "p_check_out_time" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_property"("p_id" "uuid", "p_name" "text" DEFAULT NULL::"text", "p_title" "text" DEFAULT NULL::"text", "p_description" "text" DEFAULT NULL::"text", "p_price_per_night" numeric DEFAULT NULL::numeric, "p_weekend_price_per_night" numeric DEFAULT NULL::numeric, "p_tier" "text" DEFAULT NULL::"text", "p_amenities" "jsonb" DEFAULT NULL::"jsonb", "p_license_url" "text" DEFAULT NULL::"text", "p_tax_bill_url" "text" DEFAULT NULL::"text", "p_current_bill_url" "text" DEFAULT NULL::"text", "p_image_url" "text" DEFAULT NULL::"text", "p_cancellation_policy" "text" DEFAULT NULL::"text", "p_rules" "text"[] DEFAULT NULL::"text"[], "p_safety_items" "text"[] DEFAULT NULL::"text"[], "p_bedrooms" integer DEFAULT NULL::integer, "p_beds" integer DEFAULT NULL::integer, "p_bathrooms" numeric DEFAULT NULL::numeric, "p_max_guests" integer DEFAULT NULL::integer, "p_area" numeric DEFAULT NULL::numeric, "p_co_host_name" "text" DEFAULT NULL::"text", "p_co_host_email" "text" DEFAULT NULL::"text", "p_address_line1" "text" DEFAULT NULL::"text", "p_address_line2" "text" DEFAULT NULL::"text", "p_landmark" "text" DEFAULT NULL::"text", "p_district" "text" DEFAULT NULL::"text", "p_city" "text" DEFAULT NULL::"text", "p_state" "text" DEFAULT NULL::"text", "p_postal_code" "text" DEFAULT NULL::"text", "p_country" "text" DEFAULT NULL::"text", "p_show_specific_location" boolean DEFAULT NULL::boolean, "p_location" "text" DEFAULT NULL::"text", "p_total_rooms" integer DEFAULT NULL::integer, "p_room_type" "text" DEFAULT NULL::"text", "p_images" "jsonb" DEFAULT NULL::"jsonb", "p_latitude" numeric DEFAULT NULL::numeric, "p_longitude" numeric DEFAULT NULL::numeric) RETURNS SETOF "public"."properties"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_current_total_rooms integer;
    v_rooms_to_add integer;
    i integer;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.properties WHERE id = p_id AND host_id = auth.uid()) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

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
        images = COALESCE(p_images, images),
        latitude = COALESCE(p_latitude, latitude),
        longitude = COALESCE(p_longitude, longitude)
    WHERE id = p_id AND host_id = auth.uid()
    RETURNING *;

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


ALTER FUNCTION "public"."update_property"("p_id" "uuid", "p_name" "text", "p_title" "text", "p_description" "text", "p_price_per_night" numeric, "p_weekend_price_per_night" numeric, "p_tier" "text", "p_amenities" "jsonb", "p_license_url" "text", "p_tax_bill_url" "text", "p_current_bill_url" "text", "p_image_url" "text", "p_cancellation_policy" "text", "p_rules" "text"[], "p_safety_items" "text"[], "p_bedrooms" integer, "p_beds" integer, "p_bathrooms" numeric, "p_max_guests" integer, "p_area" numeric, "p_co_host_name" "text", "p_co_host_email" "text", "p_address_line1" "text", "p_address_line2" "text", "p_landmark" "text", "p_district" "text", "p_city" "text", "p_state" "text", "p_postal_code" "text", "p_country" "text", "p_show_specific_location" boolean, "p_location" "text", "p_total_rooms" integer, "p_room_type" "text", "p_images" "jsonb", "p_latitude" numeric, "p_longitude" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_property"("p_id" "uuid", "p_name" "text" DEFAULT NULL::"text", "p_title" "text" DEFAULT NULL::"text", "p_description" "text" DEFAULT NULL::"text", "p_price_per_night" numeric DEFAULT NULL::numeric, "p_weekend_price_per_night" numeric DEFAULT NULL::numeric, "p_tier" "text" DEFAULT NULL::"text", "p_amenities" "jsonb" DEFAULT NULL::"jsonb", "p_license_url" "text" DEFAULT NULL::"text", "p_tax_bill_url" "text" DEFAULT NULL::"text", "p_current_bill_url" "text" DEFAULT NULL::"text", "p_image_url" "text" DEFAULT NULL::"text", "p_cancellation_policy" "text" DEFAULT NULL::"text", "p_rules" "text"[] DEFAULT NULL::"text"[], "p_safety_items" "text"[] DEFAULT NULL::"text"[], "p_bedrooms" integer DEFAULT NULL::integer, "p_beds" integer DEFAULT NULL::integer, "p_bathrooms" numeric DEFAULT NULL::numeric, "p_max_guests" integer DEFAULT NULL::integer, "p_area" numeric DEFAULT NULL::numeric, "p_co_host_name" "text" DEFAULT NULL::"text", "p_co_host_email" "text" DEFAULT NULL::"text", "p_address_line1" "text" DEFAULT NULL::"text", "p_address_line2" "text" DEFAULT NULL::"text", "p_landmark" "text" DEFAULT NULL::"text", "p_district" "text" DEFAULT NULL::"text", "p_city" "text" DEFAULT NULL::"text", "p_state" "text" DEFAULT NULL::"text", "p_postal_code" "text" DEFAULT NULL::"text", "p_country" "text" DEFAULT NULL::"text", "p_show_specific_location" boolean DEFAULT NULL::boolean, "p_location" "text" DEFAULT NULL::"text", "p_total_rooms" integer DEFAULT NULL::integer, "p_room_type" "text" DEFAULT NULL::"text", "p_check_in_time" "text" DEFAULT NULL::"text", "p_check_out_time" "text" DEFAULT NULL::"text", "p_bulk_booking_discount" numeric DEFAULT NULL::numeric) RETURNS SETOF "public"."properties"
    LANGUAGE "plpgsql" SECURITY DEFINER
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
        room_type = COALESCE(p_room_type, room_type),
        check_in_time = COALESCE(p_check_in_time, check_in_time),
        check_out_time = COALESCE(p_check_out_time, check_out_time),
        bulk_booking_discount = COALESCE(p_bulk_booking_discount, bulk_booking_discount)
    WHERE id = p_id AND host_id = auth.uid()
    RETURNING *;

    -- Handle room creation if total_rooms increased
    IF p_total_rooms IS NOT NULL AND p_total_rooms > COALESCE(v_current_total_rooms, 0) THEN
        v_rooms_to_add := p_total_rooms - COALESCE(v_current_total_rooms, 0);
        FOR i IN 1..v_rooms_to_add LOOP
             INSERT INTO public.rooms (property_id, name, status)
             VALUES (p_id, 'New Room ' || (COALESCE(v_current_total_rooms, 0) + i), 'available');
        END LOOP;
    END IF;

    RETURN QUERY SELECT * FROM public.properties WHERE id = p_id;
END;
$$;


ALTER FUNCTION "public"."update_property"("p_id" "uuid", "p_name" "text", "p_title" "text", "p_description" "text", "p_price_per_night" numeric, "p_weekend_price_per_night" numeric, "p_tier" "text", "p_amenities" "jsonb", "p_license_url" "text", "p_tax_bill_url" "text", "p_current_bill_url" "text", "p_image_url" "text", "p_cancellation_policy" "text", "p_rules" "text"[], "p_safety_items" "text"[], "p_bedrooms" integer, "p_beds" integer, "p_bathrooms" numeric, "p_max_guests" integer, "p_area" numeric, "p_co_host_name" "text", "p_co_host_email" "text", "p_address_line1" "text", "p_address_line2" "text", "p_landmark" "text", "p_district" "text", "p_city" "text", "p_state" "text", "p_postal_code" "text", "p_country" "text", "p_show_specific_location" boolean, "p_location" "text", "p_total_rooms" integer, "p_room_type" "text", "p_check_in_time" "text", "p_check_out_time" "text", "p_bulk_booking_discount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_property"("p_id" "uuid", "p_name" "text", "p_title" "text", "p_description" "text", "p_price_per_night" numeric, "p_weekend_price_per_night" numeric, "p_tier" "text", "p_amenities" "jsonb", "p_license_url" "text" DEFAULT ''::"text", "p_tax_bill_url" "text" DEFAULT ''::"text", "p_current_bill_url" "text" DEFAULT ''::"text", "p_aadhar_url" "text" DEFAULT ''::"text", "p_pan_url" "text" DEFAULT ''::"text", "p_noc_url" "text" DEFAULT ''::"text", "p_image_url" "text" DEFAULT ''::"text", "p_images" "jsonb" DEFAULT '[]'::"jsonb", "p_cancellation_policy" "text" DEFAULT ''::"text", "p_rules" "jsonb" DEFAULT '[]'::"jsonb", "p_safety_items" "jsonb" DEFAULT '[]'::"jsonb", "p_bedrooms" integer DEFAULT 0, "p_beds" integer DEFAULT 0, "p_bathrooms" integer DEFAULT 0, "p_max_guests" integer DEFAULT 0, "p_area" numeric DEFAULT 0, "p_total_rooms" integer DEFAULT 0, "p_room_type" "text" DEFAULT ''::"text", "p_co_host_name" "text" DEFAULT ''::"text", "p_co_host_email" "text" DEFAULT ''::"text", "p_address_line1" "text" DEFAULT ''::"text", "p_address_line2" "text" DEFAULT ''::"text", "p_landmark" "text" DEFAULT ''::"text", "p_district" "text" DEFAULT ''::"text", "p_city" "text" DEFAULT ''::"text", "p_state" "text" DEFAULT ''::"text", "p_postal_code" "text" DEFAULT ''::"text", "p_country" "text" DEFAULT ''::"text", "p_show_specific_location" boolean DEFAULT false, "p_location" "text" DEFAULT ''::"text", "p_latitude" double precision DEFAULT NULL::double precision, "p_longitude" double precision DEFAULT NULL::double precision) RETURNS SETOF "public"."properties"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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
        latitude              = p_latitude,
        longitude             = p_longitude,
        updated_at            = now()
    WHERE id = p_id
      AND host_id = auth.uid()
    RETURNING *;
END;
$$;


ALTER FUNCTION "public"."update_property"("p_id" "uuid", "p_name" "text", "p_title" "text", "p_description" "text", "p_price_per_night" numeric, "p_weekend_price_per_night" numeric, "p_tier" "text", "p_amenities" "jsonb", "p_license_url" "text", "p_tax_bill_url" "text", "p_current_bill_url" "text", "p_aadhar_url" "text", "p_pan_url" "text", "p_noc_url" "text", "p_image_url" "text", "p_images" "jsonb", "p_cancellation_policy" "text", "p_rules" "jsonb", "p_safety_items" "jsonb", "p_bedrooms" integer, "p_beds" integer, "p_bathrooms" integer, "p_max_guests" integer, "p_area" numeric, "p_total_rooms" integer, "p_room_type" "text", "p_co_host_name" "text", "p_co_host_email" "text", "p_address_line1" "text", "p_address_line2" "text", "p_landmark" "text", "p_district" "text", "p_city" "text", "p_state" "text", "p_postal_code" "text", "p_country" "text", "p_show_specific_location" boolean, "p_location" "text", "p_latitude" double precision, "p_longitude" double precision) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."amenities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "host_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric DEFAULT 0,
    "currency" "text" DEFAULT 'INR'::"text",
    "type" "text" NOT NULL,
    "is_active" boolean DEFAULT false,
    "property_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."amenities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."amenity_tracking" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "amenity_id" "uuid" NOT NULL,
    "booking_count" integer DEFAULT 0,
    "revenue_generated" numeric DEFAULT 0,
    "month" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."amenity_tracking" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."aura_quality_scores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "overall_score" integer NOT NULL,
    "optimization_tips" "text"[] DEFAULT ARRAY[]::"text"[],
    "ranking_improvement" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."aura_quality_scores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blocked_dates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "check_dates" CHECK (("end_date" >= "start_date"))
);


ALTER TABLE "public"."blocked_dates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_rooms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid",
    "room_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."booking_rooms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "guest_id" "uuid" NOT NULL,
    "check_in" "date" NOT NULL,
    "check_out" "date" NOT NULL,
    "total_price" numeric(10,2),
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "guests" integer DEFAULT 1,
    "booking_type" "text" DEFAULT 'single'::"text",
    "total_rooms_booked" integer DEFAULT 1,
    "room_id" "uuid",
    "razorpay_order_id" "text",
    "razorpay_payment_id" "text",
    "referral_discount_applied" boolean DEFAULT false,
    "has_free_cancellation" boolean DEFAULT false,
    "free_cancellation_fee" numeric DEFAULT 0,
    "bulk_booking_discount" numeric,
    CONSTRAINT "bookings_booking_type_check" CHECK (("booking_type" = ANY (ARRAY['single'::"text", 'bulk'::"text"])))
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "type" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "budget" numeric,
    "spend" numeric,
    "conversions" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cleaning_checklist_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "checklist_id" "uuid" NOT NULL,
    "task" "text" NOT NULL,
    "completed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."cleaning_checklist_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cleaning_checklists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "assigned_to" "text" NOT NULL,
    "status" "text" DEFAULT 'Pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."cleaning_checklists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."commission_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "host_id" "uuid",
    "property_id" "uuid",
    "commission_type" "text" NOT NULL,
    "commission_value" numeric(10,2) NOT NULL,
    "is_active" boolean DEFAULT true,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "commission_rules_commission_type_check" CHECK (("commission_type" = ANY (ARRAY['percentage'::"text", 'fixed'::"text"]))),
    CONSTRAINT "commission_rules_commission_value_check" CHECK (("commission_value" >= (0)::numeric)),
    CONSTRAINT "commission_scope_check" CHECK ((("host_id" IS NOT NULL) OR ("property_id" IS NOT NULL)))
);


ALTER TABLE "public"."commission_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."community_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "author_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "category" "text" NOT NULL,
    "likes_count" integer DEFAULT 0,
    "replies_count" integer DEFAULT 0,
    "is_trending" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."community_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."disputes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "caseNumber" "text" NOT NULL,
    "guestName" "text" NOT NULL,
    "hostName" "text" NOT NULL,
    "propertyName" "text" NOT NULL,
    "issueType" "text" NOT NULL,
    "priority" "text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "createdDate" timestamp with time zone DEFAULT "now"(),
    "lastUpdate" timestamp with time zone DEFAULT "now"(),
    "booking_id" "uuid",
    "guest_id" "uuid",
    "host_id" "uuid",
    "property_id" "uuid",
    "description" "text"
);


ALTER TABLE "public"."disputes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "host_id" "uuid" NOT NULL,
    "guest_id" "uuid",
    "property_id" "uuid",
    "name" "text" NOT NULL,
    "type" "text" DEFAULT 'Other'::"text" NOT NULL,
    "url" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."faqs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question" "text" NOT NULL,
    "answer" "text" NOT NULL,
    "order_index" integer DEFAULT 0
);


ALTER TABLE "public"."faqs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."host_kyc_details" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "legal_business_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "pan_number" "text" NOT NULL,
    "bank_account_number" "text" NOT NULL,
    "bank_ifsc" "text" NOT NULL,
    "bank_beneficiary_name" "text" NOT NULL,
    "razorpay_account_id" "text",
    "razorpay_product_id" "text",
    "kyc_status" "text" DEFAULT 'pending'::"text",
    "kyc_error_message" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "host_kyc_details_kyc_status_check" CHECK (("kyc_status" = ANY (ARRAY['pending'::"text", 'under_review'::"text", 'activated'::"text", 'needs_clarification'::"text", 'suspended'::"text"])))
);


ALTER TABLE "public"."host_kyc_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."licenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "license_number" "text" NOT NULL,
    "expiry_date" "date" NOT NULL,
    "status" "text" NOT NULL,
    "document_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."licenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."maintenance_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid",
    "issue" "text" NOT NULL,
    "reported_by" "text" NOT NULL,
    "reported_date" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "status" "text" DEFAULT 'New'::"text",
    "priority" "text" DEFAULT 'Low'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."maintenance_alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."market_comparisons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "average_local_price" numeric NOT NULL,
    "suggested_price" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."market_comparisons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "receiver_id" "uuid" NOT NULL,
    "property_id" "uuid",
    "content" "text" NOT NULL,
    "sentiment" "text" DEFAULT 'Neutral'::"text",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text",
    "status" "text" DEFAULT 'info'::"text",
    "is_read" boolean DEFAULT false,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_transfers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "host_id" "uuid",
    "razorpay_order_id" "text",
    "razorpay_payment_id" "text",
    "razorpay_transfer_id" "text",
    "total_amount" numeric(12,2) NOT NULL,
    "platform_commission" numeric(12,2) DEFAULT 0 NOT NULL,
    "host_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "commission_type" "text",
    "commission_value" numeric(10,2),
    "transfer_status" "text" DEFAULT 'pending'::"text",
    "failure_reason" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "payment_transfers_commission_type_check" CHECK (("commission_type" = ANY (ARRAY['percentage'::"text", 'fixed'::"text"]))),
    CONSTRAINT "payment_transfers_transfer_status_check" CHECK (("transfer_status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'settled'::"text", 'failed'::"text", 'reversed'::"text"])))
);


ALTER TABLE "public"."payment_transfers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid",
    "amount" numeric NOT NULL,
    "currency" "text" DEFAULT 'usd'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "stripe_payment_intent_id" "text",
    "stripe_transfer_id" "text",
    "commission_amount" numeric,
    "host_payout_amount" numeric,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payouts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "host_id" "uuid",
    "amount" numeric NOT NULL,
    "currency" "text" DEFAULT 'usd'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "stripe_payout_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payouts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."preferences" (
    "user_id" "uuid" NOT NULL,
    "email_notifications" boolean DEFAULT true,
    "sms_notifications" boolean DEFAULT false,
    "instant_book" boolean DEFAULT false,
    "currency" "text" DEFAULT 'USD'::"text",
    "language" "text" DEFAULT 'en-US'::"text",
    "timezone" "text"
);


ALTER TABLE "public"."preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "email" "text",
    "avatar_url" "text",
    "role" "text" DEFAULT 'guest'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "reward_points" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "reviewer_id" "uuid" NOT NULL,
    "receiver_id" "uuid" NOT NULL,
    "property_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "cleanliness_rating" integer DEFAULT 0,
    "accuracy_rating" integer DEFAULT 0,
    "check_in_rating" integer DEFAULT 0,
    "communication_rating" integer DEFAULT 0,
    "location_rating" integer DEFAULT 0,
    "value_rating" integer DEFAULT 0,
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rooms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid",
    "name" "text" NOT NULL,
    "status" "text" DEFAULT 'available'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "rooms_status_check" CHECK (("status" = ANY (ARRAY['available'::"text", 'maintenance'::"text", 'booked'::"text"])))
);


ALTER TABLE "public"."rooms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "guest_id" "uuid",
    "host_id" "uuid",
    "amount" numeric(10,2) NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "property_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "type" "text",
    "title" "text",
    "description" "text",
    "date_awarded" timestamp with time zone,
    "icon" "text"
);


ALTER TABLE "public"."user_achievements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_emergency_contacts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "contact_name" character varying(100) NOT NULL,
    "relationship" character varying(50),
    "phone_number" character varying(20) NOT NULL,
    "is_primary" boolean DEFAULT false
);


ALTER TABLE "public"."user_emergency_contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_identity_docs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "document_type" character varying(50),
    "document_url" "text" NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_identity_docs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_personal_info" (
    "user_id" "uuid" NOT NULL,
    "email" "text",
    "phone" "text",
    "bio" "text",
    "languages" "text"[],
    "emergencyContact" "text",
    "dateOfBirth" "date",
    "location" "text",
    "occupation" "text",
    "nationality" "text",
    "gender" "text"
);


ALTER TABLE "public"."user_personal_info" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "user_id" "uuid" NOT NULL,
    "notifications" "jsonb" DEFAULT '{"sms": false, "push": true, "email": true}'::"jsonb",
    "privacy" "jsonb" DEFAULT '{"showEmail": false, "showPhone": false, "showLocation": true}'::"jsonb",
    "guestPreferences" "jsonb",
    "hostPreferences" "jsonb"
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_search_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "search_query" "text",
    "filters_used" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_search_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_verifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "idVerified" boolean DEFAULT false,
    "emailVerified" boolean DEFAULT false,
    "phoneVerified" boolean DEFAULT false,
    "documentVerified" boolean DEFAULT false,
    "adminApproved" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."user_verifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_wallets" (
    "user_id" "uuid" NOT NULL,
    "balance" numeric(12,2) DEFAULT 0.00,
    "currency" character varying(10) DEFAULT 'INR'::character varying,
    "loyalty_points" integer DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "razorpay_account_id" "text"
);


ALTER TABLE "public"."user_wallets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text",
    "email" "text",
    "avatar_url" "text",
    "status" "text" DEFAULT 'active'::"text",
    "role" "text" DEFAULT 'guest'::"text",
    "total_bookings" integer DEFAULT 0,
    "avatar_alt" "text",
    "completion_percentage" integer DEFAULT 0,
    "kyc_status" "text" DEFAULT 'not_verified'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "stripe_account_id" "text",
    "stripe_customer_id" "text",
    "stripe_onboarding_completed" boolean DEFAULT false,
    "cancellation_count" integer DEFAULT 0,
    "referral_code" "text",
    "referred_by" "uuid",
    "referral_benefit_count" integer DEFAULT 0,
    "referral_commissions_remaining" integer DEFAULT 0
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."verifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "doc_type" "text" NOT NULL,
    "file_url" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."verifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wishlist" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "property_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "board" "text"
);


ALTER TABLE "public"."wishlist" OWNER TO "postgres";


ALTER TABLE ONLY "public"."amenities"
    ADD CONSTRAINT "amenities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."amenity_tracking"
    ADD CONSTRAINT "amenity_tracking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."aura_quality_scores"
    ADD CONSTRAINT "aura_quality_scores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blocked_dates"
    ADD CONSTRAINT "blocked_dates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_rooms"
    ADD CONSTRAINT "booking_rooms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cleaning_checklist_items"
    ADD CONSTRAINT "cleaning_checklist_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cleaning_checklists"
    ADD CONSTRAINT "cleaning_checklists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."commission_rules"
    ADD CONSTRAINT "commission_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_likes"
    ADD CONSTRAINT "community_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_likes"
    ADD CONSTRAINT "community_likes_post_id_user_id_key" UNIQUE ("post_id", "user_id");



ALTER TABLE ONLY "public"."community_posts"
    ADD CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."faqs"
    ADD CONSTRAINT "faqs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."host_kyc_details"
    ADD CONSTRAINT "host_kyc_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."host_kyc_details"
    ADD CONSTRAINT "host_kyc_details_user_id_unique" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."licenses"
    ADD CONSTRAINT "licenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."maintenance_alerts"
    ADD CONSTRAINT "maintenance_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."market_comparisons"
    ADD CONSTRAINT "market_comparisons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_transfers"
    ADD CONSTRAINT "payment_transfers_booking_id_unique" UNIQUE ("booking_id");



ALTER TABLE ONLY "public"."payment_transfers"
    ADD CONSTRAINT "payment_transfers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payouts"
    ADD CONSTRAINT "payouts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."preferences"
    ADD CONSTRAINT "preferences_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_emergency_contacts"
    ADD CONSTRAINT "user_emergency_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_identity_docs"
    ADD CONSTRAINT "user_identity_docs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_personal_info"
    ADD CONSTRAINT "user_personal_info_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_search_history"
    ADD CONSTRAINT "user_search_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_verifications"
    ADD CONSTRAINT "user_verifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_wallets"
    ADD CONSTRAINT "user_wallets_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_referral_code_key" UNIQUE ("referral_code");



ALTER TABLE ONLY "public"."verifications"
    ADD CONSTRAINT "verifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wishlist"
    ADD CONSTRAINT "wishlist_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wishlist"
    ADD CONSTRAINT "wishlist_user_id_property_id_key" UNIQUE ("user_id", "property_id");



CREATE INDEX "idx_commission_rules_host" ON "public"."commission_rules" USING "btree" ("host_id");



CREATE INDEX "idx_commission_rules_property" ON "public"."commission_rules" USING "btree" ("property_id");



CREATE INDEX "idx_host_kyc_user_id" ON "public"."host_kyc_details" USING "btree" ("user_id");



CREATE INDEX "idx_payment_transfers_booking" ON "public"."payment_transfers" USING "btree" ("booking_id");



CREATE INDEX "idx_payment_transfers_host" ON "public"."payment_transfers" USING "btree" ("host_id");



CREATE INDEX "idx_payment_transfers_razorpay_order" ON "public"."payment_transfers" USING "btree" ("razorpay_order_id");



CREATE INDEX "idx_payment_transfers_razorpay_payment" ON "public"."payment_transfers" USING "btree" ("razorpay_payment_id");



CREATE OR REPLACE TRIGGER "host_kyc_details_updated_at" BEFORE UPDATE ON "public"."host_kyc_details" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "payment_transfers_updated_at" BEFORE UPDATE ON "public"."payment_transfers" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "update_post_likes_count_trigger" AFTER INSERT OR DELETE ON "public"."community_likes" FOR EACH ROW EXECUTE FUNCTION "public"."update_post_likes_count"();



ALTER TABLE ONLY "public"."amenities"
    ADD CONSTRAINT "amenities_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."amenities"
    ADD CONSTRAINT "amenities_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."amenity_tracking"
    ADD CONSTRAINT "amenity_tracking_amenity_id_fkey" FOREIGN KEY ("amenity_id") REFERENCES "public"."amenities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."aura_quality_scores"
    ADD CONSTRAINT "aura_quality_scores_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blocked_dates"
    ADD CONSTRAINT "blocked_dates_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_rooms"
    ADD CONSTRAINT "booking_rooms_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_rooms"
    ADD CONSTRAINT "booking_rooms_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id");



ALTER TABLE ONLY "public"."cleaning_checklist_items"
    ADD CONSTRAINT "cleaning_checklist_items_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "public"."cleaning_checklists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cleaning_checklists"
    ADD CONSTRAINT "cleaning_checklists_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."commission_rules"
    ADD CONSTRAINT "commission_rules_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."commission_rules"
    ADD CONSTRAINT "commission_rules_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_likes"
    ADD CONSTRAINT "community_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_likes"
    ADD CONSTRAINT "community_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_posts"
    ADD CONSTRAINT "community_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id");



ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "fk_host_id" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."host_kyc_details"
    ADD CONSTRAINT "host_kyc_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."licenses"
    ADD CONSTRAINT "licenses_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."licenses"
    ADD CONSTRAINT "licenses_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."maintenance_alerts"
    ADD CONSTRAINT "maintenance_alerts_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."market_comparisons"
    ADD CONSTRAINT "market_comparisons_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_transfers"
    ADD CONSTRAINT "payment_transfers_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_transfers"
    ADD CONSTRAINT "payment_transfers_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id");



ALTER TABLE ONLY "public"."payouts"
    ADD CONSTRAINT "payouts_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_emergency_contacts"
    ADD CONSTRAINT "user_emergency_contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_identity_docs"
    ADD CONSTRAINT "user_identity_docs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_personal_info"
    ADD CONSTRAINT "user_personal_info_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_search_history"
    ADD CONSTRAINT "user_search_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_verifications"
    ADD CONSTRAINT "user_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_wallets"
    ADD CONSTRAINT "user_wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_referred_by_fkey" FOREIGN KEY ("referred_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."verifications"
    ADD CONSTRAINT "verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wishlist"
    ADD CONSTRAINT "wishlist_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wishlist"
    ADD CONSTRAINT "wishlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "3_Hosts_Can_Delete_Own_Properties" ON "public"."properties" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "host_id"));



CREATE POLICY "4_Hosts_Can_Select_Own_Properties" ON "public"."properties" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "host_id"));



CREATE POLICY "Admins can manage all cleaning checklist items" ON "public"."cleaning_checklist_items" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage all cleaning checklists" ON "public"."cleaning_checklists" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage all documents" ON "public"."documents" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage all licenses" ON "public"."licenses" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage all maintenance alerts" ON "public"."maintenance_alerts" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage aura scores" ON "public"."aura_quality_scores" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage commission rules" ON "public"."commission_rules" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage market comparisons" ON "public"."market_comparisons" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can update any property" ON "public"."properties" FOR UPDATE TO "authenticated" USING ((("auth"."jwt"() ->> 'user_role'::"text") = '"admin"'::"text"));



CREATE POLICY "Admins can update verifications" ON "public"."verifications" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all KYC details" ON "public"."host_kyc_details" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all amenities" ON "public"."amenities" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all properties" ON "public"."properties" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'user_role'::"text") = '"admin"'::"text"));



CREATE POLICY "Admins can view all tracking data" ON "public"."amenity_tracking" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all transfers" ON "public"."payment_transfers" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'admin'::"text")))));



CREATE POLICY "Allow admins to manage notifications" ON "public"."notifications" USING ((( SELECT "users"."role"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())) = 'admin'::"text")) WITH CHECK ((( SELECT "users"."role"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "Allow admins to modify rooms" ON "public"."rooms" USING ((( SELECT "users"."role"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())) = ANY (ARRAY['admin'::"text", 'host'::"text"])));



CREATE POLICY "Allow admins to read all properties" ON "public"."properties" FOR SELECT USING ((( SELECT "users"."role"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "Allow authenticated users to insert bookings" ON "public"."bookings" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to insert property" ON "public"."properties" FOR INSERT TO "authenticated" WITH CHECK (("host_id" = "auth"."uid"()));



CREATE POLICY "Allow full access for service_role" ON "public"."campaigns" USING (true) WITH CHECK (true);



CREATE POLICY "Allow read access for authenticated users" ON "public"."campaigns" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Anyone can view community posts" ON "public"."community_posts" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can view likes" ON "public"."community_likes" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable read access for all rooms" ON "public"."rooms" FOR SELECT USING (true);



CREATE POLICY "Guests and Hosts can create disputes" ON "public"."disputes" FOR INSERT WITH CHECK ((("auth"."uid"() = "guest_id") OR ("auth"."uid"() = "host_id")));



CREATE POLICY "Guests can view transfers for their bookings" ON "public"."payment_transfers" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."bookings" "b"
  WHERE (("b"."id" = "payment_transfers"."booking_id") AND ("b"."guest_id" = "auth"."uid"())))));



CREATE POLICY "Hosts can delete licenses for their properties" ON "public"."licenses" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."properties" "p"
  WHERE (("p"."id" = "licenses"."property_id") AND ("p"."host_id" = "auth"."uid"())))));



CREATE POLICY "Hosts can delete their own amenities" ON "public"."amenities" FOR DELETE TO "authenticated" USING (("host_id" = "auth"."uid"()));



CREATE POLICY "Hosts can delete their own blocked dates" ON "public"."blocked_dates" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."properties" "p"
  WHERE (("p"."id" = "blocked_dates"."property_id") AND ("p"."host_id" = "auth"."uid"())))));



CREATE POLICY "Hosts can insert licenses for their properties" ON "public"."licenses" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."properties" "p"
  WHERE (("p"."id" = "licenses"."property_id") AND ("p"."host_id" = "auth"."uid"())))));



CREATE POLICY "Hosts can insert their own KYC details" ON "public"."host_kyc_details" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Hosts can insert their own amenities" ON "public"."amenities" FOR INSERT TO "authenticated" WITH CHECK (("host_id" = "auth"."uid"()));



CREATE POLICY "Hosts can insert their own blocked dates" ON "public"."blocked_dates" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."properties" "p"
  WHERE (("p"."id" = "blocked_dates"."property_id") AND ("p"."host_id" = "auth"."uid"())))));



CREATE POLICY "Hosts can insert their own properties" ON "public"."properties" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "host_id") AND ("status" = 'pending'::"text")));



CREATE POLICY "Hosts can manage cleaning checklist items for their properties" ON "public"."cleaning_checklist_items" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."cleaning_checklists" "cc"
     JOIN "public"."properties" "p" ON (("cc"."property_id" = "p"."id")))
  WHERE (("cc"."id" = "cleaning_checklist_items"."checklist_id") AND ("p"."host_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."cleaning_checklists" "cc"
     JOIN "public"."properties" "p" ON (("cc"."property_id" = "p"."id")))
  WHERE (("cc"."id" = "cleaning_checklist_items"."checklist_id") AND ("p"."host_id" = "auth"."uid"())))));



CREATE POLICY "Hosts can manage cleaning checklists for their properties" ON "public"."cleaning_checklists" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."properties" "p"
  WHERE (("p"."id" = "cleaning_checklists"."property_id") AND ("p"."host_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."properties" "p"
  WHERE (("p"."id" = "cleaning_checklists"."property_id") AND ("p"."host_id" = "auth"."uid"())))));



CREATE POLICY "Hosts can manage maintenance alerts for their properties" ON "public"."maintenance_alerts" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."properties" "p"
  WHERE (("p"."id" = "maintenance_alerts"."property_id") AND ("p"."host_id" = "auth"."uid"())))));



CREATE POLICY "Hosts can manage their own documents" ON "public"."documents" TO "authenticated" USING (("host_id" = "auth"."uid"())) WITH CHECK (("host_id" = "auth"."uid"()));



CREATE POLICY "Hosts can manage their own properties" ON "public"."properties" FOR SELECT USING (("host_id" = "auth"."uid"()));



CREATE POLICY "Hosts can manage their rooms" ON "public"."rooms" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."properties" "p"
  WHERE (("p"."id" = "rooms"."property_id") AND ("p"."host_id" = "auth"."uid"())))));



CREATE POLICY "Hosts can update licenses for their properties" ON "public"."licenses" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."properties" "p"
  WHERE (("p"."id" = "licenses"."property_id") AND ("p"."host_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."properties" "p"
  WHERE (("p"."id" = "licenses"."property_id") AND ("p"."host_id" = "auth"."uid"())))));



CREATE POLICY "Hosts can update their disputes" ON "public"."disputes" FOR UPDATE USING ((("auth"."uid"() = "host_id") OR (( SELECT "users"."role"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())) = 'admin'::"text")));



CREATE POLICY "Hosts can update their own KYC details" ON "public"."host_kyc_details" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Hosts can update their own amenities" ON "public"."amenities" FOR UPDATE TO "authenticated" USING (("host_id" = "auth"."uid"())) WITH CHECK (("host_id" = "auth"."uid"()));



CREATE POLICY "Hosts can update their own properties" ON "public"."properties" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "host_id")) WITH CHECK ((("auth"."uid"() = "host_id") AND ("status" <> 'active'::"text")));



CREATE POLICY "Hosts can view booking rooms for their properties" ON "public"."booking_rooms" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."rooms" "r"
     JOIN "public"."properties" "p" ON (("p"."id" = "r"."property_id")))
  WHERE (("r"."id" = "booking_rooms"."room_id") AND ("p"."host_id" = "auth"."uid"())))));



CREATE POLICY "Hosts can view licenses for their properties" ON "public"."licenses" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."properties" "p"
  WHERE (("p"."id" = "licenses"."property_id") AND ("p"."host_id" = "auth"."uid"())))));



CREATE POLICY "Hosts can view their market comparisons" ON "public"."market_comparisons" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."properties" "p"
  WHERE (("p"."id" = "market_comparisons"."property_id") AND ("p"."host_id" = "auth"."uid"())))));



CREATE POLICY "Hosts can view their own KYC details" ON "public"."host_kyc_details" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Hosts can view their own amenities" ON "public"."amenities" FOR SELECT TO "authenticated" USING (("host_id" = "auth"."uid"()));



CREATE POLICY "Hosts can view their own commission rules" ON "public"."commission_rules" FOR SELECT TO "authenticated" USING (("host_id" = "auth"."uid"()));



CREATE POLICY "Hosts can view their own properties" ON "public"."properties" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "host_id"));



CREATE POLICY "Hosts can view their own transfers" ON "public"."payment_transfers" FOR SELECT TO "authenticated" USING (("host_id" = "auth"."uid"()));



CREATE POLICY "Hosts can view their property aura scores" ON "public"."aura_quality_scores" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."properties" "p"
  WHERE (("p"."id" = "aura_quality_scores"."property_id") AND ("p"."host_id" = "auth"."uid"())))));



CREATE POLICY "Hosts can view tracking for their amenities" ON "public"."amenity_tracking" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."amenities" "a"
  WHERE (("a"."id" = "amenity_tracking"."amenity_id") AND ("a"."host_id" = "auth"."uid"())))));



CREATE POLICY "INSERT " ON "public"."users" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Public can read basic user info" ON "public"."users" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Public can see approved properties" ON "public"."properties" FOR SELECT USING (("status" = 'approved'::"text"));



CREATE POLICY "Public can view active properties" ON "public"."properties" FOR SELECT TO "authenticated", "anon" USING (("status" = 'active'::"text"));



CREATE POLICY "Public can view blocked dates" ON "public"."blocked_dates" FOR SELECT USING (true);



CREATE POLICY "Public can view reviews" ON "public"."reviews" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Public can view rooms" ON "public"."rooms" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Receivers can update their messages" ON "public"."messages" FOR UPDATE TO "authenticated" USING (("receiver_id" = "auth"."uid"())) WITH CHECK (("receiver_id" = "auth"."uid"()));



CREATE POLICY "SELECT" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Service role can insert payment_transfers" ON "public"."payment_transfers" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service role can update payment_transfers" ON "public"."payment_transfers" FOR UPDATE TO "service_role" USING (true);



CREATE POLICY "UPDATE " ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can create community posts" ON "public"."community_posts" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Users can create reviews for their bookings" ON "public"."reviews" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."bookings" "b"
  WHERE (("b"."id" = "reviews"."booking_id") AND ("b"."guest_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own community posts" ON "public"."community_posts" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "author_id"));



CREATE POLICY "Users can delete their own wishlist" ON "public"."wishlist" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert maintenance alerts" ON "public"."maintenance_alerts" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Users can insert messages" ON "public"."messages" FOR INSERT TO "authenticated" WITH CHECK (("sender_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own personal info" ON "public"."user_personal_info" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own verifications" ON "public"."verifications" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own wishlist" ON "public"."wishlist" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can like posts" ON "public"."community_likes" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own wishlist" ON "public"."wishlist" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can unlike posts" ON "public"."community_likes" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own personal info" ON "public"."user_personal_info" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own wallet" ON "public"."user_wallets" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own community posts" ON "public"."community_posts" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "author_id"));



CREATE POLICY "Users can update their own reviews" ON "public"."reviews" FOR UPDATE TO "authenticated" USING (("reviewer_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own wishlist" ON "public"."wishlist" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view maintenance alerts" ON "public"."maintenance_alerts" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can view own bookings" ON "public"."bookings" FOR SELECT USING (("auth"."uid"() = "guest_id"));



CREATE POLICY "Users can view own personal info" ON "public"."user_personal_info" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own wallet" ON "public"."user_wallets" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their booking rooms" ON "public"."booking_rooms" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."bookings" "b"
  WHERE (("b"."id" = "booking_rooms"."booking_id") AND ("b"."guest_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their messages" ON "public"."messages" FOR SELECT TO "authenticated" USING ((("sender_id" = "auth"."uid"()) OR ("receiver_id" = "auth"."uid"())));



CREATE POLICY "Users can view their own bookings" ON "public"."bookings" FOR SELECT TO "authenticated" USING ((("guest_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."properties"
  WHERE (("properties"."id" = "bookings"."property_id") AND ("properties"."host_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view their own disputes" ON "public"."disputes" FOR SELECT USING ((("auth"."uid"() = "guest_id") OR ("auth"."uid"() = "host_id") OR (( SELECT "users"."role"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())) = 'admin'::"text")));



CREATE POLICY "Users can view their own payments" ON "public"."payments" FOR SELECT USING ((("auth"."uid"() IN ( SELECT "bookings"."guest_id"
   FROM "public"."bookings"
  WHERE ("bookings"."id" = "payments"."booking_id"))) OR ("auth"."uid"() IN ( SELECT "properties"."host_id"
   FROM "public"."properties"
  WHERE ("properties"."id" = ( SELECT "bookings"."property_id"
           FROM "public"."bookings"
          WHERE ("bookings"."id" = "payments"."booking_id")))))));



CREATE POLICY "Users can view their own wishlist" ON "public"."wishlist" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users view own transactions" ON "public"."transactions" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "guest_id") OR ("auth"."uid"() = "host_id")));



CREATE POLICY "Users view own verifications" ON "public"."verifications" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."amenities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."amenity_tracking" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."aura_quality_scores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blocked_dates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."booking_rooms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cleaning_checklist_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cleaning_checklists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."commission_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."disputes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."faqs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."host_kyc_details" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "hosts_delete_own_documents" ON "public"."documents" FOR DELETE TO "authenticated" USING (("host_id" = "auth"."uid"()));



CREATE POLICY "hosts_insert_own_documents" ON "public"."documents" FOR INSERT TO "authenticated" WITH CHECK (("host_id" = "auth"."uid"()));



CREATE POLICY "hosts_select_own_documents" ON "public"."documents" FOR SELECT TO "authenticated" USING (("host_id" = "auth"."uid"()));



ALTER TABLE "public"."licenses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."maintenance_alerts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."market_comparisons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_transfers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payouts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rooms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_achievements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_emergency_contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_identity_docs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_personal_info" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_search_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_verifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_wallets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."verifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wishlist" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."cleaning_checklist_items";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."cleaning_checklists";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."community_likes";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."community_posts";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."maintenance_alerts";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."messages";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


























































































































































































GRANT ALL ON FUNCTION "public"."admin_approve_property"("p_property_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_approve_property"("p_property_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_approve_property"("p_property_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_reject_property"("p_property_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_reject_property"("p_property_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_reject_property"("p_property_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."block_property_dates"("p_property_id" "uuid", "p_start_date" "date", "p_end_date" "date", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."block_property_dates"("p_property_id" "uuid", "p_start_date" "date", "p_end_date" "date", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."block_property_dates"("p_property_id" "uuid", "p_start_date" "date", "p_end_date" "date", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_availability"("p_property_id" "uuid", "p_check_in" "date", "p_check_out" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."check_availability"("p_property_id" "uuid", "p_check_in" "date", "p_check_out" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_availability"("p_property_id" "uuid", "p_check_in" "date", "p_check_out" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_booking_with_rooms"("p_booking_type" "text", "p_check_in" "date", "p_check_out" "date", "p_guest_id" "uuid", "p_property_id" "uuid", "p_room_ids" "uuid"[], "p_total_price" numeric, "p_has_free_cancellation" boolean, "p_free_cancellation_fee" numeric, "p_bulk_booking_discount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."create_booking_with_rooms"("p_booking_type" "text", "p_check_in" "date", "p_check_out" "date", "p_guest_id" "uuid", "p_property_id" "uuid", "p_room_ids" "uuid"[], "p_total_price" numeric, "p_has_free_cancellation" boolean, "p_free_cancellation_fee" numeric, "p_bulk_booking_discount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_booking_with_rooms"("p_booking_type" "text", "p_check_in" "date", "p_check_out" "date", "p_guest_id" "uuid", "p_property_id" "uuid", "p_room_ids" "uuid"[], "p_total_price" numeric, "p_has_free_cancellation" boolean, "p_free_cancellation_fee" numeric, "p_bulk_booking_discount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_bulk_booking"("p_booking_type" "text", "p_check_in" "date", "p_check_out" "date", "p_guest_id" "uuid", "p_property_id" "uuid", "p_room_count" integer, "p_total_price" numeric, "p_has_free_cancellation" boolean, "p_free_cancellation_fee" numeric, "p_bulk_booking_discount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."create_bulk_booking"("p_booking_type" "text", "p_check_in" "date", "p_check_out" "date", "p_guest_id" "uuid", "p_property_id" "uuid", "p_room_count" integer, "p_total_price" numeric, "p_has_free_cancellation" boolean, "p_free_cancellation_fee" numeric, "p_bulk_booking_discount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_bulk_booking"("p_booking_type" "text", "p_check_in" "date", "p_check_out" "date", "p_guest_id" "uuid", "p_property_id" "uuid", "p_room_count" integer, "p_total_price" numeric, "p_has_free_cancellation" boolean, "p_free_cancellation_fee" numeric, "p_bulk_booking_discount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_property"("p_name" "text", "p_title" "text", "p_description" "text", "p_price_per_night" numeric, "p_weekend_price_per_night" numeric, "p_location" "text", "p_tier" "text", "p_amenities" "jsonb", "p_license_url" "text", "p_tax_bill_url" "text", "p_current_bill_url" "text", "p_image_url" "text", "p_cancellation_policy" "text", "p_rules" "text"[], "p_safety_items" "text"[], "p_bedrooms" integer, "p_beds" integer, "p_bathrooms" numeric, "p_max_guests" integer, "p_area" numeric, "p_co_host_name" "text", "p_co_host_email" "text", "p_address_line1" "text", "p_address_line2" "text", "p_landmark" "text", "p_district" "text", "p_city" "text", "p_state" "text", "p_postal_code" "text", "p_country" "text", "p_show_specific_location" boolean, "p_total_rooms" integer, "p_room_type" "text", "p_check_in_time" "text", "p_check_out_time" "text", "p_bulk_booking_discount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."create_property"("p_name" "text", "p_title" "text", "p_description" "text", "p_price_per_night" numeric, "p_weekend_price_per_night" numeric, "p_location" "text", "p_tier" "text", "p_amenities" "jsonb", "p_license_url" "text", "p_tax_bill_url" "text", "p_current_bill_url" "text", "p_image_url" "text", "p_cancellation_policy" "text", "p_rules" "text"[], "p_safety_items" "text"[], "p_bedrooms" integer, "p_beds" integer, "p_bathrooms" numeric, "p_max_guests" integer, "p_area" numeric, "p_co_host_name" "text", "p_co_host_email" "text", "p_address_line1" "text", "p_address_line2" "text", "p_landmark" "text", "p_district" "text", "p_city" "text", "p_state" "text", "p_postal_code" "text", "p_country" "text", "p_show_specific_location" boolean, "p_total_rooms" integer, "p_room_type" "text", "p_check_in_time" "text", "p_check_out_time" "text", "p_bulk_booking_discount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_property"("p_name" "text", "p_title" "text", "p_description" "text", "p_price_per_night" numeric, "p_weekend_price_per_night" numeric, "p_location" "text", "p_tier" "text", "p_amenities" "jsonb", "p_license_url" "text", "p_tax_bill_url" "text", "p_current_bill_url" "text", "p_image_url" "text", "p_cancellation_policy" "text", "p_rules" "text"[], "p_safety_items" "text"[], "p_bedrooms" integer, "p_beds" integer, "p_bathrooms" numeric, "p_max_guests" integer, "p_area" numeric, "p_co_host_name" "text", "p_co_host_email" "text", "p_address_line1" "text", "p_address_line2" "text", "p_landmark" "text", "p_district" "text", "p_city" "text", "p_state" "text", "p_postal_code" "text", "p_country" "text", "p_show_specific_location" boolean, "p_total_rooms" integer, "p_room_type" "text", "p_check_in_time" "text", "p_check_out_time" "text", "p_bulk_booking_discount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_property"("p_name" "text", "p_title" "text", "p_description" "text", "p_price_per_night" numeric, "p_weekend_price_per_night" numeric, "p_tier" "text", "p_amenities" "jsonb", "p_license_url" "text", "p_tax_bill_url" "text", "p_current_bill_url" "text", "p_aadhar_url" "text", "p_pan_url" "text", "p_noc_url" "text", "p_image_url" "text", "p_images" "jsonb", "p_cancellation_policy" "text", "p_rules" "jsonb", "p_safety_items" "jsonb", "p_bedrooms" integer, "p_beds" integer, "p_bathrooms" numeric, "p_max_guests" integer, "p_area" numeric, "p_address_line1" "text", "p_address_line2" "text", "p_landmark" "text", "p_district" "text", "p_city" "text", "p_state" "text", "p_postal_code" "text", "p_country" "text", "p_location" "text", "p_total_rooms" integer, "p_check_in_time" "text", "p_check_out_time" "text", "p_latitude" numeric, "p_longitude" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."create_property"("p_name" "text", "p_title" "text", "p_description" "text", "p_price_per_night" numeric, "p_weekend_price_per_night" numeric, "p_tier" "text", "p_amenities" "jsonb", "p_license_url" "text", "p_tax_bill_url" "text", "p_current_bill_url" "text", "p_aadhar_url" "text", "p_pan_url" "text", "p_noc_url" "text", "p_image_url" "text", "p_images" "jsonb", "p_cancellation_policy" "text", "p_rules" "jsonb", "p_safety_items" "jsonb", "p_bedrooms" integer, "p_beds" integer, "p_bathrooms" numeric, "p_max_guests" integer, "p_area" numeric, "p_address_line1" "text", "p_address_line2" "text", "p_landmark" "text", "p_district" "text", "p_city" "text", "p_state" "text", "p_postal_code" "text", "p_country" "text", "p_location" "text", "p_total_rooms" integer, "p_check_in_time" "text", "p_check_out_time" "text", "p_latitude" numeric, "p_longitude" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_property"("p_name" "text", "p_title" "text", "p_description" "text", "p_price_per_night" numeric, "p_weekend_price_per_night" numeric, "p_tier" "text", "p_amenities" "jsonb", "p_license_url" "text", "p_tax_bill_url" "text", "p_current_bill_url" "text", "p_aadhar_url" "text", "p_pan_url" "text", "p_noc_url" "text", "p_image_url" "text", "p_images" "jsonb", "p_cancellation_policy" "text", "p_rules" "jsonb", "p_safety_items" "jsonb", "p_bedrooms" integer, "p_beds" integer, "p_bathrooms" numeric, "p_max_guests" integer, "p_area" numeric, "p_address_line1" "text", "p_address_line2" "text", "p_landmark" "text", "p_district" "text", "p_city" "text", "p_state" "text", "p_postal_code" "text", "p_country" "text", "p_location" "text", "p_total_rooms" integer, "p_check_in_time" "text", "p_check_out_time" "text", "p_latitude" numeric, "p_longitude" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_referral_benefit"("p_host_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_referral_benefit"("p_host_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_referral_benefit"("p_host_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_available_rooms"("p_property_id" "uuid", "p_check_in" "date", "p_check_out" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_available_rooms"("p_property_id" "uuid", "p_check_in" "date", "p_check_out" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_available_rooms"("p_property_id" "uuid", "p_check_in" "date", "p_check_out" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_commission_for_booking"("p_property_id" "uuid", "p_total_price" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."get_commission_for_booking"("p_property_id" "uuid", "p_total_price" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_commission_for_booking"("p_property_id" "uuid", "p_total_price" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_property_rooms_availability"("p_property_id" "uuid", "p_check_in" "date", "p_check_out" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_property_rooms_availability"("p_property_id" "uuid", "p_check_in" "date", "p_check_out" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_property_rooms_availability"("p_property_id" "uuid", "p_check_in" "date", "p_check_out" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_rooms_realtime_status"("p_property_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_rooms_realtime_status"("p_property_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_rooms_realtime_status"("p_property_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_user_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_user_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_user_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."toggle_property_status"("p_id" "uuid", "p_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."toggle_property_status"("p_id" "uuid", "p_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."toggle_property_status"("p_id" "uuid", "p_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."unblock_property_dates"("p_block_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."unblock_property_dates"("p_block_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unblock_property_dates"("p_block_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_post_likes_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_post_likes_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_post_likes_count"() TO "service_role";



GRANT ALL ON TABLE "public"."properties" TO "anon";
GRANT ALL ON TABLE "public"."properties" TO "authenticated";
GRANT ALL ON TABLE "public"."properties" TO "service_role";



GRANT ALL ON FUNCTION "public"."update_property"("p_id" "uuid", "p_name" "text", "p_title" "text", "p_description" "text", "p_price_per_night" numeric, "p_weekend_price_per_night" numeric, "p_tier" "text", "p_amenities" "jsonb", "p_license_url" "text", "p_tax_bill_url" "text", "p_current_bill_url" "text", "p_image_url" "text", "p_cancellation_policy" "text", "p_rules" "text"[], "p_safety_items" "text"[], "p_bedrooms" integer, "p_beds" integer, "p_bathrooms" numeric, "p_max_guests" integer, "p_area" numeric, "p_co_host_name" "text", "p_co_host_email" "text", "p_address_line1" "text", "p_address_line2" "text", "p_landmark" "text", "p_district" "text", "p_city" "text", "p_state" "text", "p_postal_code" "text", "p_country" "text", "p_show_specific_location" boolean, "p_location" "text", "p_total_rooms" integer, "p_room_type" "text", "p_check_in_time" "text", "p_check_out_time" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_property"("p_id" "uuid", "p_name" "text", "p_title" "text", "p_description" "text", "p_price_per_night" numeric, "p_weekend_price_per_night" numeric, "p_tier" "text", "p_amenities" "jsonb", "p_license_url" "text", "p_tax_bill_url" "text", "p_current_bill_url" "text", "p_image_url" "text", "p_cancellation_policy" "text", "p_rules" "text"[], "p_safety_items" "text"[], "p_bedrooms" integer, "p_beds" integer, "p_bathrooms" numeric, "p_max_guests" integer, "p_area" numeric, "p_co_host_name" "text", "p_co_host_email" "text", "p_address_line1" "text", "p_address_line2" "text", "p_landmark" "text", "p_district" "text", "p_city" "text", "p_state" "text", "p_postal_code" "text", "p_country" "text", "p_show_specific_location" boolean, "p_location" "text", "p_total_rooms" integer, "p_room_type" "text", "p_check_in_time" "text", "p_check_out_time" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_property"("p_id" "uuid", "p_name" "text", "p_title" "text", "p_description" "text", "p_price_per_night" numeric, "p_weekend_price_per_night" numeric, "p_tier" "text", "p_amenities" "jsonb", "p_license_url" "text", "p_tax_bill_url" "text", "p_current_bill_url" "text", "p_image_url" "text", "p_cancellation_policy" "text", "p_rules" "text"[], "p_safety_items" "text"[], "p_bedrooms" integer, "p_beds" integer, "p_bathrooms" numeric, "p_max_guests" integer, "p_area" numeric, "p_co_host_name" "text", "p_co_host_email" "text", "p_address_line1" "text", "p_address_line2" "text", "p_landmark" "text", "p_district" "text", "p_city" "text", "p_state" "text", "p_postal_code" "text", "p_country" "text", "p_show_specific_location" boolean, "p_location" "text", "p_total_rooms" integer, "p_room_type" "text", "p_check_in_time" "text", "p_check_out_time" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_property"("p_id" "uuid", "p_name" "text", "p_title" "text", "p_description" "text", "p_price_per_night" numeric, "p_weekend_price_per_night" numeric, "p_tier" "text", "p_amenities" "jsonb", "p_license_url" "text", "p_tax_bill_url" "text", "p_current_bill_url" "text", "p_image_url" "text", "p_cancellation_policy" "text", "p_rules" "text"[], "p_safety_items" "text"[], "p_bedrooms" integer, "p_beds" integer, "p_bathrooms" numeric, "p_max_guests" integer, "p_area" numeric, "p_co_host_name" "text", "p_co_host_email" "text", "p_address_line1" "text", "p_address_line2" "text", "p_landmark" "text", "p_district" "text", "p_city" "text", "p_state" "text", "p_postal_code" "text", "p_country" "text", "p_show_specific_location" boolean, "p_location" "text", "p_total_rooms" integer, "p_room_type" "text", "p_images" "jsonb", "p_latitude" numeric, "p_longitude" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."update_property"("p_id" "uuid", "p_name" "text", "p_title" "text", "p_description" "text", "p_price_per_night" numeric, "p_weekend_price_per_night" numeric, "p_tier" "text", "p_amenities" "jsonb", "p_license_url" "text", "p_tax_bill_url" "text", "p_current_bill_url" "text", "p_image_url" "text", "p_cancellation_policy" "text", "p_rules" "text"[], "p_safety_items" "text"[], "p_bedrooms" integer, "p_beds" integer, "p_bathrooms" numeric, "p_max_guests" integer, "p_area" numeric, "p_co_host_name" "text", "p_co_host_email" "text", "p_address_line1" "text", "p_address_line2" "text", "p_landmark" "text", "p_district" "text", "p_city" "text", "p_state" "text", "p_postal_code" "text", "p_country" "text", "p_show_specific_location" boolean, "p_location" "text", "p_total_rooms" integer, "p_room_type" "text", "p_images" "jsonb", "p_latitude" numeric, "p_longitude" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_property"("p_id" "uuid", "p_name" "text", "p_title" "text", "p_description" "text", "p_price_per_night" numeric, "p_weekend_price_per_night" numeric, "p_tier" "text", "p_amenities" "jsonb", "p_license_url" "text", "p_tax_bill_url" "text", "p_current_bill_url" "text", "p_image_url" "text", "p_cancellation_policy" "text", "p_rules" "text"[], "p_safety_items" "text"[], "p_bedrooms" integer, "p_beds" integer, "p_bathrooms" numeric, "p_max_guests" integer, "p_area" numeric, "p_co_host_name" "text", "p_co_host_email" "text", "p_address_line1" "text", "p_address_line2" "text", "p_landmark" "text", "p_district" "text", "p_city" "text", "p_state" "text", "p_postal_code" "text", "p_country" "text", "p_show_specific_location" boolean, "p_location" "text", "p_total_rooms" integer, "p_room_type" "text", "p_images" "jsonb", "p_latitude" numeric, "p_longitude" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_property"("p_id" "uuid", "p_name" "text", "p_title" "text", "p_description" "text", "p_price_per_night" numeric, "p_weekend_price_per_night" numeric, "p_tier" "text", "p_amenities" "jsonb", "p_license_url" "text", "p_tax_bill_url" "text", "p_current_bill_url" "text", "p_image_url" "text", "p_cancellation_policy" "text", "p_rules" "text"[], "p_safety_items" "text"[], "p_bedrooms" integer, "p_beds" integer, "p_bathrooms" numeric, "p_max_guests" integer, "p_area" numeric, "p_co_host_name" "text", "p_co_host_email" "text", "p_address_line1" "text", "p_address_line2" "text", "p_landmark" "text", "p_district" "text", "p_city" "text", "p_state" "text", "p_postal_code" "text", "p_country" "text", "p_show_specific_location" boolean, "p_location" "text", "p_total_rooms" integer, "p_room_type" "text", "p_check_in_time" "text", "p_check_out_time" "text", "p_bulk_booking_discount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."update_property"("p_id" "uuid", "p_name" "text", "p_title" "text", "p_description" "text", "p_price_per_night" numeric, "p_weekend_price_per_night" numeric, "p_tier" "text", "p_amenities" "jsonb", "p_license_url" "text", "p_tax_bill_url" "text", "p_current_bill_url" "text", "p_image_url" "text", "p_cancellation_policy" "text", "p_rules" "text"[], "p_safety_items" "text"[], "p_bedrooms" integer, "p_beds" integer, "p_bathrooms" numeric, "p_max_guests" integer, "p_area" numeric, "p_co_host_name" "text", "p_co_host_email" "text", "p_address_line1" "text", "p_address_line2" "text", "p_landmark" "text", "p_district" "text", "p_city" "text", "p_state" "text", "p_postal_code" "text", "p_country" "text", "p_show_specific_location" boolean, "p_location" "text", "p_total_rooms" integer, "p_room_type" "text", "p_check_in_time" "text", "p_check_out_time" "text", "p_bulk_booking_discount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_property"("p_id" "uuid", "p_name" "text", "p_title" "text", "p_description" "text", "p_price_per_night" numeric, "p_weekend_price_per_night" numeric, "p_tier" "text", "p_amenities" "jsonb", "p_license_url" "text", "p_tax_bill_url" "text", "p_current_bill_url" "text", "p_image_url" "text", "p_cancellation_policy" "text", "p_rules" "text"[], "p_safety_items" "text"[], "p_bedrooms" integer, "p_beds" integer, "p_bathrooms" numeric, "p_max_guests" integer, "p_area" numeric, "p_co_host_name" "text", "p_co_host_email" "text", "p_address_line1" "text", "p_address_line2" "text", "p_landmark" "text", "p_district" "text", "p_city" "text", "p_state" "text", "p_postal_code" "text", "p_country" "text", "p_show_specific_location" boolean, "p_location" "text", "p_total_rooms" integer, "p_room_type" "text", "p_check_in_time" "text", "p_check_out_time" "text", "p_bulk_booking_discount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_property"("p_id" "uuid", "p_name" "text", "p_title" "text", "p_description" "text", "p_price_per_night" numeric, "p_weekend_price_per_night" numeric, "p_tier" "text", "p_amenities" "jsonb", "p_license_url" "text", "p_tax_bill_url" "text", "p_current_bill_url" "text", "p_aadhar_url" "text", "p_pan_url" "text", "p_noc_url" "text", "p_image_url" "text", "p_images" "jsonb", "p_cancellation_policy" "text", "p_rules" "jsonb", "p_safety_items" "jsonb", "p_bedrooms" integer, "p_beds" integer, "p_bathrooms" integer, "p_max_guests" integer, "p_area" numeric, "p_total_rooms" integer, "p_room_type" "text", "p_co_host_name" "text", "p_co_host_email" "text", "p_address_line1" "text", "p_address_line2" "text", "p_landmark" "text", "p_district" "text", "p_city" "text", "p_state" "text", "p_postal_code" "text", "p_country" "text", "p_show_specific_location" boolean, "p_location" "text", "p_latitude" double precision, "p_longitude" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."update_property"("p_id" "uuid", "p_name" "text", "p_title" "text", "p_description" "text", "p_price_per_night" numeric, "p_weekend_price_per_night" numeric, "p_tier" "text", "p_amenities" "jsonb", "p_license_url" "text", "p_tax_bill_url" "text", "p_current_bill_url" "text", "p_aadhar_url" "text", "p_pan_url" "text", "p_noc_url" "text", "p_image_url" "text", "p_images" "jsonb", "p_cancellation_policy" "text", "p_rules" "jsonb", "p_safety_items" "jsonb", "p_bedrooms" integer, "p_beds" integer, "p_bathrooms" integer, "p_max_guests" integer, "p_area" numeric, "p_total_rooms" integer, "p_room_type" "text", "p_co_host_name" "text", "p_co_host_email" "text", "p_address_line1" "text", "p_address_line2" "text", "p_landmark" "text", "p_district" "text", "p_city" "text", "p_state" "text", "p_postal_code" "text", "p_country" "text", "p_show_specific_location" boolean, "p_location" "text", "p_latitude" double precision, "p_longitude" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_property"("p_id" "uuid", "p_name" "text", "p_title" "text", "p_description" "text", "p_price_per_night" numeric, "p_weekend_price_per_night" numeric, "p_tier" "text", "p_amenities" "jsonb", "p_license_url" "text", "p_tax_bill_url" "text", "p_current_bill_url" "text", "p_aadhar_url" "text", "p_pan_url" "text", "p_noc_url" "text", "p_image_url" "text", "p_images" "jsonb", "p_cancellation_policy" "text", "p_rules" "jsonb", "p_safety_items" "jsonb", "p_bedrooms" integer, "p_beds" integer, "p_bathrooms" integer, "p_max_guests" integer, "p_area" numeric, "p_total_rooms" integer, "p_room_type" "text", "p_co_host_name" "text", "p_co_host_email" "text", "p_address_line1" "text", "p_address_line2" "text", "p_landmark" "text", "p_district" "text", "p_city" "text", "p_state" "text", "p_postal_code" "text", "p_country" "text", "p_show_specific_location" boolean, "p_location" "text", "p_latitude" double precision, "p_longitude" double precision) TO "service_role";
























GRANT ALL ON TABLE "public"."amenities" TO "anon";
GRANT ALL ON TABLE "public"."amenities" TO "authenticated";
GRANT ALL ON TABLE "public"."amenities" TO "service_role";



GRANT ALL ON TABLE "public"."amenity_tracking" TO "anon";
GRANT ALL ON TABLE "public"."amenity_tracking" TO "authenticated";
GRANT ALL ON TABLE "public"."amenity_tracking" TO "service_role";



GRANT ALL ON TABLE "public"."aura_quality_scores" TO "anon";
GRANT ALL ON TABLE "public"."aura_quality_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."aura_quality_scores" TO "service_role";



GRANT ALL ON TABLE "public"."blocked_dates" TO "anon";
GRANT ALL ON TABLE "public"."blocked_dates" TO "authenticated";
GRANT ALL ON TABLE "public"."blocked_dates" TO "service_role";



GRANT ALL ON TABLE "public"."booking_rooms" TO "anon";
GRANT ALL ON TABLE "public"."booking_rooms" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_rooms" TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."campaigns" TO "anon";
GRANT ALL ON TABLE "public"."campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."cleaning_checklist_items" TO "anon";
GRANT ALL ON TABLE "public"."cleaning_checklist_items" TO "authenticated";
GRANT ALL ON TABLE "public"."cleaning_checklist_items" TO "service_role";



GRANT ALL ON TABLE "public"."cleaning_checklists" TO "anon";
GRANT ALL ON TABLE "public"."cleaning_checklists" TO "authenticated";
GRANT ALL ON TABLE "public"."cleaning_checklists" TO "service_role";



GRANT ALL ON TABLE "public"."commission_rules" TO "anon";
GRANT ALL ON TABLE "public"."commission_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."commission_rules" TO "service_role";



GRANT ALL ON TABLE "public"."community_likes" TO "anon";
GRANT ALL ON TABLE "public"."community_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."community_likes" TO "service_role";



GRANT ALL ON TABLE "public"."community_posts" TO "anon";
GRANT ALL ON TABLE "public"."community_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."community_posts" TO "service_role";



GRANT ALL ON TABLE "public"."disputes" TO "anon";
GRANT ALL ON TABLE "public"."disputes" TO "authenticated";
GRANT ALL ON TABLE "public"."disputes" TO "service_role";



GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";



GRANT ALL ON TABLE "public"."faqs" TO "anon";
GRANT ALL ON TABLE "public"."faqs" TO "authenticated";
GRANT ALL ON TABLE "public"."faqs" TO "service_role";



GRANT ALL ON TABLE "public"."host_kyc_details" TO "anon";
GRANT ALL ON TABLE "public"."host_kyc_details" TO "authenticated";
GRANT ALL ON TABLE "public"."host_kyc_details" TO "service_role";



GRANT ALL ON TABLE "public"."licenses" TO "anon";
GRANT ALL ON TABLE "public"."licenses" TO "authenticated";
GRANT ALL ON TABLE "public"."licenses" TO "service_role";



GRANT ALL ON TABLE "public"."maintenance_alerts" TO "anon";
GRANT ALL ON TABLE "public"."maintenance_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."maintenance_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."market_comparisons" TO "anon";
GRANT ALL ON TABLE "public"."market_comparisons" TO "authenticated";
GRANT ALL ON TABLE "public"."market_comparisons" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."payment_transfers" TO "anon";
GRANT ALL ON TABLE "public"."payment_transfers" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_transfers" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."payouts" TO "anon";
GRANT ALL ON TABLE "public"."payouts" TO "authenticated";
GRANT ALL ON TABLE "public"."payouts" TO "service_role";



GRANT ALL ON TABLE "public"."preferences" TO "anon";
GRANT ALL ON TABLE "public"."preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."preferences" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."rooms" TO "anon";
GRANT ALL ON TABLE "public"."rooms" TO "authenticated";
GRANT ALL ON TABLE "public"."rooms" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."user_achievements" TO "anon";
GRANT ALL ON TABLE "public"."user_achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."user_achievements" TO "service_role";



GRANT ALL ON TABLE "public"."user_emergency_contacts" TO "anon";
GRANT ALL ON TABLE "public"."user_emergency_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."user_emergency_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."user_identity_docs" TO "anon";
GRANT ALL ON TABLE "public"."user_identity_docs" TO "authenticated";
GRANT ALL ON TABLE "public"."user_identity_docs" TO "service_role";



GRANT ALL ON TABLE "public"."user_personal_info" TO "anon";
GRANT ALL ON TABLE "public"."user_personal_info" TO "authenticated";
GRANT ALL ON TABLE "public"."user_personal_info" TO "service_role";



GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."user_search_history" TO "anon";
GRANT ALL ON TABLE "public"."user_search_history" TO "authenticated";
GRANT ALL ON TABLE "public"."user_search_history" TO "service_role";



GRANT ALL ON TABLE "public"."user_verifications" TO "anon";
GRANT ALL ON TABLE "public"."user_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."user_verifications" TO "service_role";



GRANT ALL ON TABLE "public"."user_wallets" TO "anon";
GRANT ALL ON TABLE "public"."user_wallets" TO "authenticated";
GRANT ALL ON TABLE "public"."user_wallets" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."verifications" TO "anon";
GRANT ALL ON TABLE "public"."verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."verifications" TO "service_role";



GRANT ALL ON TABLE "public"."wishlist" TO "anon";
GRANT ALL ON TABLE "public"."wishlist" TO "authenticated";
GRANT ALL ON TABLE "public"."wishlist" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































