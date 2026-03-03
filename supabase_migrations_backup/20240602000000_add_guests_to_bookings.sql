-- Migration to add 'guests' column to 'bookings' table

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS guests INTEGER DEFAULT 1;

-- Update RLS policies if necessary to include the new column (usually implied for ALL)
-- Ensure the column is accessible
GRANT SELECT, INSERT, UPDATE ON TABLE public.bookings TO authenticated;
