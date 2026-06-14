-- Update get_rooms_realtime_status to include room_type and room_amenities
CREATE OR REPLACE FUNCTION public.get_rooms_realtime_status(p_property_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    status TEXT, -- 'available', 'maintenance', 'booked'
    current_guest TEXT,
    booking_id UUID,
    room_type TEXT,
    room_amenities JSONB
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
    SELECT check_out_time INTO v_check_out_time_str FROM public.properties WHERE id = p_property_id;
    
    BEGIN
        IF v_check_out_time_str IS NOT NULL THEN
            -- Handle formats like "11:00 AM"
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
                AND b.status IN ('confirmed', 'checked_in')
                AND b.check_in_date <= v_current_date
                AND (
                    b.check_out_date > v_current_date 
                    OR (b.check_out_date = v_current_date AND v_current_time < v_check_out_time)
                )
            ) THEN 'booked'
            ELSE 'available'
        END as calculated_status,
        (
            SELECT p.full_name FROM public.booking_rooms br
            JOIN public.bookings b ON b.id = br.booking_id
            JOIN public.profiles p ON p.id = b.guest_id
            WHERE br.room_id = r.id
            AND b.status IN ('confirmed', 'checked_in')
            AND b.check_in_date <= v_current_date
            AND (
                b.check_out_date > v_current_date 
                OR (b.check_out_date = v_current_date AND v_current_time < v_check_out_time)
            )
            LIMIT 1
        ) as guest_name,
        (
            SELECT b.id FROM public.booking_rooms br
            JOIN public.bookings b ON b.id = br.booking_id
            WHERE br.room_id = r.id
            AND b.status IN ('confirmed', 'checked_in')
            AND b.check_in_date <= v_current_date
            AND (
                b.check_out_date > v_current_date 
                OR (b.check_out_date = v_current_date AND v_current_time < v_check_out_time)
            )
            LIMIT 1
        ) as b_id,
        r.room_type,
        r.room_amenities
    FROM public.rooms r
    WHERE r.property_id = p_property_id
    ORDER BY r.name ASC;
END;
$$;
