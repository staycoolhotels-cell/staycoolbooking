-- Create blocked_dates table
CREATE TABLE IF NOT EXISTS public.blocked_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT check_dates CHECK (end_date >= start_date)
);

-- Add rejection_reason to properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- RLS Policies for blocked_dates

-- Enable RLS
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access
CREATE POLICY "Public can view blocked dates" ON public.blocked_dates
    FOR SELECT
    USING (true);

-- Policy: Hosts can manage their own blocked dates
CREATE POLICY "Hosts can insert their own blocked dates" ON public.blocked_dates
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.properties p
            WHERE p.id = blocked_dates.property_id
            AND p.host_id = auth.uid()
        )
    );

CREATE POLICY "Hosts can delete their own blocked dates" ON public.blocked_dates
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.properties p
            WHERE p.id = blocked_dates.property_id
            AND p.host_id = auth.uid()
        )
    );
