-- Create activities table
CREATE TABLE IF NOT EXISTS public.activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'info'::text,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT activities_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Select policy: Allow all authenticated users to read
DROP POLICY IF EXISTS "Allow all authenticated users to read activities" ON public.activities;
CREATE POLICY "Allow all authenticated users to read activities"
ON public.activities FOR SELECT
TO authenticated
USING (true);

-- Insert policy: Allow all authenticated users to insert
DROP POLICY IF EXISTS "Allow all authenticated users to insert activities" ON public.activities;
CREATE POLICY "Allow all authenticated users to insert activities"
ON public.activities FOR INSERT
TO authenticated
WITH CHECK (true);

-- Delete policy: Allow admins to delete
DROP POLICY IF EXISTS "Allow admins to delete activities" ON public.activities;
CREATE POLICY "Allow admins to delete activities"
ON public.activities FOR DELETE
TO authenticated
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- Enable Realtime for activities table safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr 
    JOIN pg_publication p ON p.oid = pr.prpubid 
    JOIN pg_class c ON c.oid = pr.prrelid 
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'activities'
  ) THEN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
    END IF;
  END IF;
END $$;
