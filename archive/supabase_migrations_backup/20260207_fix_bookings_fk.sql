-- Migration to fix 'bookings' foreign key to reference 'public.users' instead of 'public.profiles'
-- This is because the handle_new_user trigger inserts into 'public.users', not 'public.profiles'.

-- Drop the incorrect foreign key constraint
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_guest_id_fkey;

-- Add the correct foreign key constraint
-- Referencing public.users(id) which should exist for all users
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_guest_id_fkey
FOREIGN KEY (guest_id)
REFERENCES public.users(id)
ON DELETE CASCADE;

-- Note: We might also want to fix other tables referencing profiles if they exist, 
-- but bookings is the immediate issue reported.
