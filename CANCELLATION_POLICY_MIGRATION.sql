-- Migration: Add Free Cancellation fields and update booking RPCs
-- Run this in Supabase SQL Editor

-- 1. Add columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS has_free_cancellation BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS free_cancellation_fee NUMERIC DEFAULT 0;

-- 2. Drop OLD versions to avoid "not unique" errors
-- We drop by name only with CASCADE if we want to be aggressive, 
-- but better to drop specific signatures if possible.
-- However, since we want to REPLACE them, let's just drop them all.
DROP FUNCTION IF EXISTS public.create_booking_with_rooms CASCADE;
DROP FUNCTION IF EXISTS public.create_bulk_booking CASCADE;

-- 3. Update create_booking_with_rooms RPC
CREATE OR REPLACE FUNCTION public.create_booking_with_rooms(
    p_booking_type text,
    p_check_in date,
    p_check_out date,
    p_guest_id uuid,
    p_property_id uuid,
    p_room_ids uuid[],
    p_total_price numeric,
    p_has_free_cancellation boolean DEFAULT false,
    p_free_cancellation_fee numeric DEFAULT 0
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
        has_free_cancellation,
        free_cancellation_fee
    )
    VALUES (
        p_guest_id,
        p_property_id,
        p_check_in,
        p_check_out,
        p_total_price,
        'pending_payment',
        p_booking_type,
        p_has_free_cancellation,
        p_free_cancellation_fee
    )
    RETURNING id INTO new_booking_id;

    -- Assign rooms (assuming a booking_rooms junction table or similar exists)
    -- If your junction table has a different name, please adjust here.
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

-- 4. Update create_bulk_booking RPC
CREATE OR REPLACE FUNCTION public.create_bulk_booking(
    p_booking_type text,
    p_check_in date,
    p_check_out date,
    p_guest_id uuid,
    p_property_id uuid,
    p_room_count integer,
    p_total_price numeric,
    p_has_free_cancellation boolean DEFAULT false,
    p_free_cancellation_fee numeric DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_booking_id uuid;
BEGIN
    INSERT INTO public.bookings (
        guest_id,
        property_id,
        check_in,
        check_out,
        total_price,
        status,
        booking_type,
        room_count,
        has_free_cancellation,
        free_cancellation_fee
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
        p_free_cancellation_fee
    )
    RETURNING id INTO new_booking_id;

    RETURN new_booking_id;
END;
$$;

-- Grant permissions explicitly with the full signature to avoid ambiguity
GRANT EXECUTE ON FUNCTION public.create_booking_with_rooms(text, date, date, uuid, uuid, uuid[], numeric, boolean, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking_with_rooms(text, date, date, uuid, uuid, uuid[], numeric, boolean, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_bulk_booking(text, date, date, uuid, uuid, integer, numeric, boolean, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_bulk_booking(text, date, date, uuid, uuid, integer, numeric, boolean, numeric) TO service_role;
