-- UPDATE: Change property creation to use 'pending' status
-- Properties will need admin approval before becoming active

DROP FUNCTION IF EXISTS public.create_property(text, text, text, numeric, numeric, text, text, jsonb, text, text, text, text) CASCADE;

CREATE FUNCTION public.create_property(
    p_name text,
    p_title text,
    p_description text,
    p_price_per_night numeric,
    p_weekend_price_per_night numeric,
    p_location text,
    p_tier text,
    p_amenities jsonb DEFAULT '[]'::jsonb,
    p_license_url text DEFAULT '',
    p_tax_bill_url text DEFAULT '',
    p_current_bill_url text DEFAULT '',
    p_image_url text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_property_id uuid;
    current_user_id uuid;
    profile_exists boolean;
BEGIN
    -- Get the authenticated user ID
    current_user_id := auth.uid();
    
    -- Ensure the user is authenticated
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check if profile exists, if not create it
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = current_user_id) INTO profile_exists;
    
    IF NOT profile_exists THEN
        -- Create a basic profile for this user
        INSERT INTO public.profiles (id)
        VALUES (current_user_id)
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- Insert the new property with PENDING status
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
        status
    )
    VALUES (
        current_user_id,
        COALESCE(p_title, p_name),
        p_description,
        p_price_per_night::numeric,
        p_weekend_price_per_night::numeric,
        p_location,
        p_tier,
        COALESCE(p_amenities, '[]'::jsonb),
        COALESCE(p_license_url, ''),
        COALESCE(p_tax_bill_url, ''),
        COALESCE(p_current_bill_url, ''),
        COALESCE(p_image_url, ''),
        'pending'  -- CHANGED: Properties start as pending, not active
    )
    RETURNING id INTO new_property_id;

    RETURN new_property_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_property(text, text, text, numeric, numeric, text, text, jsonb, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_property(text, text, text, numeric, numeric, text, text, jsonb, text, text, text, text) TO service_role;

-- Verify
SELECT 'SUCCESS! Properties will now be created with pending status' as status;
