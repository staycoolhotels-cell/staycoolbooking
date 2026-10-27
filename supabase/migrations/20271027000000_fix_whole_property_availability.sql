-- Fix check_availability for whole-property listings (no sub-unit rooms in the rooms table).
-- Previously, properties with no rows in public.rooms always returned 0 (available rooms count),
-- causing the UI to show "Already Booked for Selected Dates" even when the property was free.
-- This mirrors the logic already present in create_bulk_booking.

DROP FUNCTION IF EXISTS public.check_availability(uuid, date, date);

CREATE OR REPLACE FUNCTION public.check_availability(
    p_property_id uuid,
    p_check_in    date,
    p_check_out   date
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_room_count   integer;
    v_booked_count integer;
BEGIN
    -- Count sub-units registered for this property
    SELECT COUNT(*) INTO v_room_count
    FROM rooms
    WHERE property_id = p_property_id;

    IF v_room_count > 0 THEN
        -- Room-based property: return the number of available (non-overlapping) rooms
        RETURN (
            SELECT COUNT(*)::integer
            FROM get_available_rooms(p_property_id, p_check_in, p_check_out)
            WHERE is_available
        );
    ELSE
        -- Whole-property listing (homestay / villa / apartment etc.) — no sub-unit rows.
        -- Available = 1 if no confirmed/checked-in booking overlaps the requested dates,
        --           = 0 otherwise.
        SELECT COUNT(*) INTO v_booked_count
        FROM bookings
        WHERE property_id = p_property_id
          AND status IN ('confirmed', 'checked_in')
          AND p_check_in  < check_out
          AND p_check_out > check_in;

        RETURN CASE WHEN v_booked_count = 0 THEN 1 ELSE 0 END;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_availability(uuid, date, date) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
