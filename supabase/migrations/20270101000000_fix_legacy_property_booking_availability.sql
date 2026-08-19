-- Fix bookings for whole-home property tiers (which intentionally have no rows in public.rooms).
-- to be booked using properties.total_rooms as their inventory.
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
    p_bulk_booking_discount numeric DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking_id uuid;
    v_available_room_ids uuid[];
    v_room_count integer;
    v_booked_count integer;
    v_room_id uuid;
BEGIN
    IF p_room_count IS NULL OR p_room_count < 1 OR p_check_in IS NULL OR p_check_out IS NULL
       OR p_check_out <= p_check_in THEN
        RAISE EXCEPTION 'Invalid booking details';
    END IF;

    -- Lock the property row so concurrent requests cannot both reserve the last unit.
    PERFORM 1
    FROM properties
    WHERE id = p_property_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Property not found';
    END IF;

    SELECT COUNT(*) INTO v_room_count
    FROM rooms
    WHERE property_id = p_property_id;

    IF v_room_count > 0 THEN
        -- Room-based properties: assign only manually available, non-overlapping rooms.
        SELECT array_agg(id) INTO v_available_room_ids
        FROM (
            SELECT r.id
            FROM rooms r
            WHERE r.property_id = p_property_id
              AND r.status = 'available'
              AND NOT EXISTS (
                  SELECT 1
                  FROM booking_rooms br
                  JOIN bookings b ON b.id = br.booking_id
                  WHERE br.room_id = r.id
                    AND b.status IN ('confirmed', 'checked_in')
                    AND p_check_in < b.check_out
                    AND p_check_out > b.check_in
              )
            ORDER BY r.id
            LIMIT p_room_count
        ) available_rooms;

        IF coalesce(array_length(v_available_room_ids, 1), 0) < p_room_count THEN
            RAISE EXCEPTION 'Not enough rooms available';
        END IF;
    ELSE
        -- Home Stay/Apartment/Villa/Dormitory listings have no individual room rows.
        -- They are booked as one whole property, not as separately bookable rooms.
        IF p_room_count <> 1 THEN
            RAISE EXCEPTION 'Whole-property listings can only be booked as one unit';
        END IF;

        SELECT count(*) INTO v_booked_count
        FROM bookings
        WHERE property_id = p_property_id
          AND status IN ('confirmed', 'checked_in')
          AND p_check_in < check_out
          AND p_check_out > check_in;

        IF v_booked_count > 0 THEN
            RAISE EXCEPTION 'Not enough rooms available';
        END IF;
    END IF;

    INSERT INTO bookings (
        guest_id, property_id, check_in, check_out, total_price, status,
        booking_type, total_rooms_booked, has_free_cancellation,
        free_cancellation_fee, bulk_booking_discount
    ) VALUES (
        p_guest_id, p_property_id, p_check_in, p_check_out, p_total_price,
        'pending_payment', p_booking_type, p_room_count,
        p_has_free_cancellation, p_free_cancellation_fee, p_bulk_booking_discount
    ) RETURNING id INTO v_booking_id;

    IF v_available_room_ids IS NOT NULL THEN
        FOREACH v_room_id IN ARRAY v_available_room_ids LOOP
            INSERT INTO booking_rooms (booking_id, room_id)
            VALUES (v_booking_id, v_room_id);
        END LOOP;
    END IF;

    RETURN v_booking_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_bulk_booking(
    text, date, date, uuid, uuid, integer, numeric, boolean, numeric, numeric
) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';

-- An unfinished payment is not a reservation. This also releases old abandoned
-- pending-payment rows that were created before the client-side cancellation.
-- Older deployments returned a different set of columns from this function, so
-- it must be dropped before recreating it with the current room_type column.
DROP FUNCTION IF EXISTS public.check_availability(uuid, date, date);
DROP FUNCTION IF EXISTS public.check_availability(date, date, uuid);
DROP FUNCTION IF EXISTS public.get_available_rooms(uuid, date, date);

CREATE OR REPLACE FUNCTION public.get_available_rooms(
    p_property_id uuid,
    p_check_in date,
    p_check_out date
)
RETURNS TABLE (
    id uuid,
    property_id uuid,
    name text,
    status text,
    is_available boolean,
    room_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT r.id, r.property_id, r.name, r.status,
        r.status = 'available' AND NOT EXISTS (
            SELECT 1
            FROM booking_rooms br
            JOIN bookings b ON b.id = br.booking_id
            WHERE br.room_id = r.id
              AND b.status IN ('confirmed', 'checked_in')
              AND p_check_in < b.check_out
              AND p_check_out > b.check_in
        ),
        r.room_type
    FROM rooms r
    WHERE r.property_id = p_property_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_availability(
    p_property_id uuid,
    p_check_in date,
    p_check_out date
)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT count(*)::integer
    FROM public.get_available_rooms(p_property_id, p_check_in, p_check_out)
    WHERE is_available;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_rooms(uuid, date, date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_availability(uuid, date, date) TO anon, authenticated;

-- Clean up abandoned checkouts created before the client-side cancellation fix.
-- A booking with a completed Razorpay payment is never changed.
UPDATE public.bookings
SET status = 'payment_failed'
WHERE status = 'pending_payment'
  AND razorpay_payment_id IS NULL;

NOTIFY pgrst, 'reload schema';
