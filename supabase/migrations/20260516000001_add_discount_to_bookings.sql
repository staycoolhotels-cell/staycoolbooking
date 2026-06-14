-- Add bulk_booking_discount column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS bulk_booking_discount numeric;
-- Drop functions to avoid signature conflicts
DROP FUNCTION IF EXISTS public.create_booking_with_rooms(text, date, date, uuid, uuid, uuid[], numeric, boolean, numeric);
DROP FUNCTION IF EXISTS public.create_bulk_booking(text, date, date, uuid, uuid, integer, numeric, boolean, numeric);
-- 1. Update create_booking_with_rooms RPC
CREATE OR REPLACE FUNCTION public.create_booking_with_rooms(
    p_booking_type text,
    p_check_in date,
    p_check_out date,
    p_guest_id uuid,
    p_property_id uuid,
    p_room_ids uuid[],
    p_total_price numeric,
    p_has_free_cancellation boolean DEFAULT false,
    p_free_cancellation_fee numeric DEFAULT 0,
    p_bulk_booking_discount numeric DEFAULT NULL -- NEW PARAMETER
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
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
-- 2. Update create_bulk_booking RPC
CREATE OR REPLACE FUNCTION public.create_bulk_booking(
    p_booking_type text,
    p_check_in date,
    p_check_out date,
    p_guest_id uuid,
    p_property_id uuid,
    p_room_count integer,
    p_total_price numeric,
    p_has_free_cancellation boolean DEFAULT false,
    p_free_cancellation_fee numeric DEFAULT 0,
    p_bulk_booking_discount numeric DEFAULT NULL -- NEW PARAMETER
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
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
-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_booking_with_rooms(text, date, date, uuid, uuid, uuid[], numeric, boolean, numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking_with_rooms(text, date, date, uuid, uuid, uuid[], numeric, boolean, numeric, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_bulk_booking(text, date, date, uuid, uuid, integer, numeric, boolean, numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_bulk_booking(text, date, date, uuid, uuid, integer, numeric, boolean, numeric, numeric) TO service_role;
