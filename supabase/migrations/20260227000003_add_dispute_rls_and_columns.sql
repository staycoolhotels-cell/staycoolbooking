-- Add missing columns to disputes table to link with core entities
ALTER TABLE public.disputes ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.bookings(id);
ALTER TABLE public.disputes ADD COLUMN IF NOT EXISTS guest_id UUID REFERENCES public.users(id);
ALTER TABLE public.disputes ADD COLUMN IF NOT EXISTS host_id UUID REFERENCES public.users(id);
ALTER TABLE public.disputes ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id);
ALTER TABLE public.disputes ADD COLUMN IF NOT EXISTS description TEXT;
-- Enable RLS
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
-- Policies
DROP POLICY IF EXISTS "Users can view their own disputes" ON public.disputes;
CREATE POLICY "Users can view their own disputes"
ON public.disputes FOR SELECT
USING (
  auth.uid() = guest_id OR 
  auth.uid() = host_id OR
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);
DROP POLICY IF EXISTS "Guests and Hosts can create disputes" ON public.disputes;
CREATE POLICY "Guests and Hosts can create disputes"
ON public.disputes FOR INSERT
WITH CHECK (
  auth.uid() = guest_id OR 
  auth.uid() = host_id
);
-- Grant access
GRANT ALL ON TABLE public.disputes TO anon, authenticated, service_role;
