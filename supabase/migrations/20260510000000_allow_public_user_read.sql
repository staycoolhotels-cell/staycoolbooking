-- Add public read policy for users table to allow viewing admin and other basic info
-- This is required for the Support Chat and Community Forum

-- First check if RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- Add policy to allow anyone to read basic user info
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Public can read basic user info'
    ) THEN
        CREATE POLICY "Public can read basic user info" 
        ON public.users FOR SELECT 
        TO anon, authenticated 
        USING (true);
    END IF;
END $$;
