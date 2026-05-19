-- CREATE MAINTENANCE ALERTS TABLE
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/dlislsrlwovcxsuqdlvy/sql/new

CREATE TABLE IF NOT EXISTS public.maintenance_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    issue TEXT NOT NULL,
    reported_by TEXT NOT NULL,
    reported_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    status TEXT DEFAULT 'New',
    priority TEXT DEFAULT 'Low',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.maintenance_alerts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow safe re-running)
DROP POLICY IF EXISTS "Users can insert maintenance alerts" ON public.maintenance_alerts;
DROP POLICY IF EXISTS "Users can view maintenance alerts" ON public.maintenance_alerts;

-- Allow authenticated users to insert alerts
CREATE POLICY "Users can insert maintenance alerts" 
ON public.maintenance_alerts FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow authenticated users to view alerts
CREATE POLICY "Users can view maintenance alerts" 
ON public.maintenance_alerts FOR SELECT 
TO authenticated 
USING (true);

-- Grant privileges
GRANT ALL ON TABLE public.maintenance_alerts TO anon, authenticated, service_role;

-- Notify postgrest to reload the schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'SUCCESS: maintenance_alerts table created!' as status;
