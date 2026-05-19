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
