-- Fix check_availability to be SECURITY DEFINER so it can read all bookings
CREATE OR REPLACE FUNCTION public.check_availability(
    p_check_in DATE,
    p_check_out DATE,
    p_property_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Grant permissions for everyone (including anon for guests)
GRANT EXECUTE ON FUNCTION public.check_availability(UUID, DATE, DATE) TO anon;
GRANT EXECUTE ON FUNCTION public.check_availability(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_availability(UUID, DATE, DATE) TO service_role;
