-- Fix check_availability RPC to be SECURITY DEFINER
-- This ensures guests can check availability even if they don't have direct access to booking records

CREATE OR REPLACE FUNCTION public.check_availability(
    p_property_id UUID,
    p_check_in DATE,
    p_check_out DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER -- IMPORTANT: Run as database owner to bypass RLS
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
        AND b.status IN ('confirmed', 'pending_payment')
        AND (
            (p_check_in BETWEEN b.check_in AND b.check_out - INTERVAL '1 day') OR
            (p_check_out - INTERVAL '1 day' BETWEEN b.check_in AND b.check_out - INTERVAL '1 day') OR
            (b.check_in BETWEEN p_check_in AND p_check_out - INTERVAL '1 day')
        );

    -- Return available rooms
    RETURN COALESCE(v_total_rooms, 0) - COALESCE(v_booked_rooms, 0);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_availability(UUID, DATE, DATE) TO anon, authenticated, service_role;
