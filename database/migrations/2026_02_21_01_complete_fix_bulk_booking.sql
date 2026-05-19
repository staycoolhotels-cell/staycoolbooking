-- COMPLETE FIX FOR BULK BOOKING SCHEMA
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/dlislsrlwovcxsuqdlvy/sql/new

-- 1. PROPERTIES TABLE UPDATES
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS total_rooms INTEGER DEFAULT 1;

-- 2. BOOKINGS TABLE UPDATES
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'single' CHECK (booking_type IN ('single', 'bulk'));
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS total_rooms_booked INTEGER DEFAULT 1;

-- 3. ROOMS TABLE
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'maintenance', 'booked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. BOOKING_ROOMS TABLE
CREATE TABLE IF NOT EXISTS public.booking_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. INITIALIZE DEFAULT ROOMS
DO $$
DECLARE
    prop RECORD;
BEGIN
    FOR prop IN SELECT id FROM public.properties WHERE NOT EXISTS (SELECT 1 FROM public.rooms WHERE property_id = properties.id) LOOP
        INSERT INTO public.rooms (property_id, name) VALUES (prop.id, 'Default Room');
    END LOOP;
END $$;

-- 6. SECURITY (RLS)
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_rooms ENABLE ROW LEVEL SECURITY;

-- DROP Policies if they exist to avoid errors on retry
DROP POLICY IF EXISTS "Public can view rooms" ON public.rooms;
DROP POLICY IF EXISTS "Users can view their booking rooms" ON public.booking_rooms;

CREATE POLICY "Public can view rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Users can view their booking rooms" ON public.booking_rooms FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_rooms.booking_id AND b.guest_id = auth.uid()));

-- 7. RPC FUNCTIONS (Alphabetical Parameters)

-- CHECK AVAILABILITY
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
    SELECT COUNT(*) INTO v_total_rooms FROM public.rooms WHERE property_id = p_property_id;
    IF v_total_rooms = 0 THEN
        SELECT total_rooms INTO v_total_rooms FROM public.properties WHERE id = p_property_id;
    END IF;

    SELECT COUNT(DISTINCT br.room_id) INTO v_booked_rooms
    FROM public.booking_rooms br
    JOIN public.bookings b ON b.id = br.booking_id
    WHERE b.property_id = p_property_id
      AND b.status IN ('confirmed', 'pending_payment')
      AND (
          (p_check_in BETWEEN b.check_in AND b.check_out - INTERVAL '1 day') OR
          (p_check_out - INTERVAL '1 day' BETWEEN b.check_in AND b.check_out - INTERVAL '1 day') OR
          (b.check_in BETWEEN p_check_in AND p_check_out - INTERVAL '1 day')
      );

    RETURN COALESCE(v_total_rooms, 1) - COALESCE(v_booked_rooms, 0);
END;
$$;

-- CREATE BULK BOOKING
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
SET search_path = public
AS $$
DECLARE
    v_booking_id UUID;
    v_available_room_ids UUID[];
    v_room_id UUID;
BEGIN
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

    INSERT INTO public.bookings (property_id, guest_id, check_in, check_out, total_price, status, booking_type, total_rooms_booked)
    VALUES (p_property_id, p_guest_id, p_check_in, p_check_out, p_total_price, 'pending_payment', p_booking_type, p_room_count)
    RETURNING id INTO v_booking_id;

    FOREACH v_room_id IN ARRAY v_available_room_ids LOOP
        INSERT INTO public.booking_rooms (booking_id, room_id) VALUES (v_booking_id, v_room_id);
    END LOOP;

    RETURN v_booking_id;
END;
$$;

-- 8. PERMISSIONS
GRANT ALL ON TABLE public.rooms TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.booking_rooms TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_availability(DATE, DATE, UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_bulk_booking(TEXT, DATE, DATE, UUID, UUID, INTEGER, NUMERIC) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';

-- 9. VERIFY
SELECT 'SUCCESS' as status;
