-- Migration to create amenities and amenity_tracking tables

-- 1. Create amenities table
CREATE TABLE IF NOT EXISTS public.amenities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'INR',
    type TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;

-- 2. Create amenity_tracking table
CREATE TABLE IF NOT EXISTS public.amenity_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amenity_id UUID NOT NULL REFERENCES public.amenities(id) ON DELETE CASCADE,
    booking_count INTEGER DEFAULT 0,
    revenue_generated NUMERIC DEFAULT 0,
    month TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.amenity_tracking ENABLE ROW LEVEL SECURITY;


-- 3. RLS Policies for amenities

-- Hosts can manage their own amenities
CREATE POLICY "Hosts can view their own amenities"
ON public.amenities FOR SELECT
TO authenticated
USING (host_id = auth.uid());

CREATE POLICY "Hosts can insert their own amenities"
ON public.amenities FOR INSERT
TO authenticated
WITH CHECK (host_id = auth.uid());

CREATE POLICY "Hosts can update their own amenities"
ON public.amenities FOR UPDATE
TO authenticated
USING (host_id = auth.uid())
WITH CHECK (host_id = auth.uid());

CREATE POLICY "Hosts can delete their own amenities"
ON public.amenities FOR DELETE
TO authenticated
USING (host_id = auth.uid());

-- Admins can view all amenities
CREATE POLICY "Admins can view all amenities"
ON public.amenities FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND u.role = 'admin'
    )
);

-- 4. RLS Policies for amenity_tracking

-- Hosts can view tracking data for their own amenities
CREATE POLICY "Hosts can view tracking for their amenities"
ON public.amenity_tracking FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.amenities a
        WHERE a.id = amenity_tracking.amenity_id
        AND a.host_id = auth.uid()
    )
);

-- Admins can view all tracking data
CREATE POLICY "Admins can view all tracking data"
ON public.amenity_tracking FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND u.role = 'admin'
    )
);
