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
