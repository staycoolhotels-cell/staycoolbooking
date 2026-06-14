-- Add cancelled_at column to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
-- Migration: Set cancelled_at for already cancelled bookings (fallback to updated_at if available, otherwise created_at)
-- We check for updated_at column first
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'bookings'
        AND column_name = 'updated_at'
    ) THEN
        UPDATE public.bookings
        SET cancelled_at = updated_at
        WHERE status = 'cancelled' AND cancelled_at IS NULL;
    ELSE
        UPDATE public.bookings
        SET cancelled_at = created_at
        WHERE status = 'cancelled' AND cancelled_at IS NULL;
    END IF;
END $$;
-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
