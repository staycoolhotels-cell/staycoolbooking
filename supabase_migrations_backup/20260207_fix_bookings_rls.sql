-- Enable RLS on bookings table if not already enabled
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts (and ensure we start fresh for this table's insert policy)
DROP POLICY IF EXISTS "Allow authenticated users to insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can insert their own bookings" ON public.bookings;

-- Create policy to allow authenticated users to insert
-- We check if the user is authenticated. 
-- Ideally, we also check that guest_id = auth.uid(), but strictly for "violation" fix, just checking auth role is a good first step.
-- Let's enforcing guest_id matches auth.uid() for better security.
CREATE POLICY "Allow authenticated users to insert bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = guest_id);

-- Also ensure they can view their own bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
CREATE POLICY "Users can view their own bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (auth.uid() = guest_id);

-- Grant necessary permissions
GRANT ALL ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
