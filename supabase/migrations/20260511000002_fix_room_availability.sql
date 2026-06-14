-- 0. Ensure property time columns exist
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS check_in_time TEXT DEFAULT '02:00 PM',
ADD COLUMN IF NOT EXISTS check_out_time TEXT DEFAULT '11:00 AM';
-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS public.get_available_rooms(uuid, date, date);
DROP FUNCTION IF EXISTS public.check_availability(uuid, date, date);
-- 1. Create a function to get available rooms with time-awareness
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
    is_available BOOLEAN
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
        ) as is_available
    FROM public.rooms r
    WHERE r.property_id = p_property_id;
END;
$$;
-- 2. Update check_availability to use the same logic
CREATE OR REPLACE FUNCTION public.check_availability(
    p_property_id UUID,
    p_check_in DATE,
    p_check_out DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
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
-- 3. Create a function for the Host Dashboard to see real-time room status
CREATE OR REPLACE FUNCTION public.get_rooms_realtime_status(p_property_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    status TEXT, -- 'available', 'maintenance', 'booked'
    current_guest TEXT,
    booking_id UUID
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
                    -- Currently occupied: (Start <= Today) AND (End > Today)
                    (b.check_in <= v_current_date AND b.check_out > v_current_date)
                    OR
                    -- OR (End == Today) AND (Current Time < Check-out Time)
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
-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_available_rooms(uuid, date, date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_availability(uuid, date, date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_rooms_realtime_status(uuid) TO authenticated;
