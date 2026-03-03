-- Add total_rooms to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS total_rooms INTEGER DEFAULT 1;

-- Create rooms table
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'maintenance', 'booked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on rooms
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rooms
CREATE POLICY "Public can view rooms" 
ON public.rooms FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Hosts can manage their rooms" 
ON public.rooms FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.properties p 
        WHERE p.id = rooms.property_id 
        AND p.host_id = auth.uid()
    )
);

-- Update bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'single' CHECK (booking_type IN ('single', 'bulk')),
ADD COLUMN IF NOT EXISTS total_rooms_booked INTEGER DEFAULT 1;

-- Create booking_rooms table to link bookings with specific rooms
CREATE TABLE IF NOT EXISTS public.booking_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on booking_rooms
ALTER TABLE public.booking_rooms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for booking_rooms
CREATE POLICY "Users can view their booking rooms" 
ON public.booking_rooms FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.bookings b 
        WHERE b.id = booking_rooms.booking_id 
        AND b.guest_id = auth.uid()
    )
);

CREATE POLICY "Hosts can view booking rooms for their properties" 
ON public.booking_rooms FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.rooms r
        JOIN public.properties p ON p.id = r.property_id
        WHERE r.id = booking_rooms.room_id 
        AND p.host_id = auth.uid()
    )
);

-- Function to automatically create a default room for existing properties
DO $$
DECLARE
    prop RECORD;
BEGIN
    FOR prop IN SELECT id, name FROM public.properties WHERE NOT EXISTS (SELECT 1 FROM public.rooms WHERE property_id = properties.id) LOOP
        INSERT INTO public.rooms (property_id, name) VALUES (prop.id, 'Default Room');
    END LOOP;
END $$;
