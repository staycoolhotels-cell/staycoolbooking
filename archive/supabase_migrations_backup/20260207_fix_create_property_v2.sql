-- Fix create_property function overloading
-- Drops all existing overloads and recreates the function with the correct signature
-- Also ensures all required columns exist

-- Ensure columns exist (Add if missing)
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS bedrooms numeric DEFAULT 0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS bathrooms numeric DEFAULT 0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS max_guests numeric DEFAULT 0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS area numeric DEFAULT 0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS co_host_name text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS co_host_email text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS address_line1 text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS address_line2 text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS landmark text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS district text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS postal_code text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS country text DEFAULT 'India - IN';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS show_specific_location boolean DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS beds numeric DEFAULT 0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS weekend_price_per_night numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS cancellation_policy text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS safety_items text[];

-- Drop all existing 'create_property' functions to avoid ambiguity
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT oid::regprocedure AS func_signature
        FROM pg_proc
        WHERE proname = 'create_property'
        AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'DROP FUNCTION ' || r.func_signature;
    END LOOP;
END $$;

-- Create the robust function
CREATE OR REPLACE FUNCTION public.create_property(
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
    p_bedrooms numeric DEFAULT 0,
    p_bathrooms numeric DEFAULT 0,
    p_max_guests numeric DEFAULT 0,
    p_area numeric DEFAULT 0,
    p_co_host_name text DEFAULT NULL,
    p_co_host_email text DEFAULT NULL,
    p_address_line1 text DEFAULT NULL,
    p_address_line2 text DEFAULT NULL,
    p_landmark text DEFAULT NULL,
    p_district text DEFAULT NULL,
    p_city text DEFAULT NULL,
    p_state text DEFAULT NULL,
    p_postal_code text DEFAULT NULL,
    p_country text DEFAULT 'India - IN',
    p_show_specific_location boolean DEFAULT false,
    p_location text DEFAULT NULL,
    p_beds numeric DEFAULT 0
)
RETURNS SETOF public.properties
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    -- Ensure the user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    RETURN QUERY
    INSERT INTO public.properties (
        host_id,
        title,
        description,
        price_per_night,
        weekend_price_per_night,
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
        location,
        beds
    ) VALUES (
        auth.uid(),
        p_title,
        p_description,
        p_price_per_night,
        p_weekend_price_per_night,
        p_tier,
        p_amenities,
        p_license_url,
        p_tax_bill_url,
        p_current_bill_url,
        p_image_url,
        p_cancellation_policy,
        (select jsonb_agg(x) from unnest(p_rules) x), -- Cast text[] to jsonb for rules column
        p_safety_items, -- Insert text[] directly to safety_items column
        p_bedrooms,
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
        p_location,
        p_beds
    )
    RETURNING *;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.create_property TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_property TO service_role;
