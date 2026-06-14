-- Update get_available_rooms to return room_type
CREATE OR REPLACE FUNCTION public.get_available_rooms(
    p_property_id UUID,
    p_check_in DATE,
    p_check_out DATE
)
RETURNS TABLE (
    id UUID,
    property_id UUID,
    name TEXT,
    status TEXT,
    is_available BOOLEAN,
    room_type TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_check_out_time_str TEXT;
    v_check_out_time TIME;
    v_current_time TIME;
    v_current_date DATE;
BEGIN
    -- Get property check-out time
    SELECT check_out_time INTO v_check_out_time_str FROM public.properties WHERE id = p_property_id;
    
    -- Parse check_out_time (default to 11:00 AM if null or invalid)
    BEGIN
        IF v_check_out_time_str IS NOT NULL THEN
            v_check_out_time := CAST(v_check_out_time_str AS TIME);
        ELSE
            v_check_out_time := TIME '11:00:00';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_check_out_time := TIME '11:00:00';
    END;

    -- Use local time for comparison if possible, or assume UTC/System time matches property config
    v_current_time := CURRENT_TIME;
    v_current_date := CURRENT_DATE;

    RETURN QUERY
    SELECT 
        r.id,
        r.property_id,
        r.name,
        r.status,
        (
            -- Room is available if:
            -- 1. Its manual status is 'available'
            r.status = 'available'
            AND
            -- 2. No overlapping bookings
            NOT EXISTS (
                SELECT 1 
                FROM public.booking_rooms br
                JOIN public.bookings b ON b.id = br.booking_id
                WHERE br.room_id = r.id
                AND b.status IN ('confirmed', 'pending_payment')
                AND (
                    -- Standard overlap logic
                    (p_check_in < b.check_out AND p_check_out > b.check_in)
                    OR
                    (
                        -- Special case: If booking for today, and a guest is checking out today, 
                        -- the room is only "available" after the check-out time.
                        p_check_in = b.check_out 
                        AND p_check_in = v_current_date 
                        AND v_current_time < v_check_out_time
                    )
                )
            )
        ) as is_available,
        r.room_type
    FROM public.rooms r
    WHERE r.property_id = p_property_id;
END;
$$;
