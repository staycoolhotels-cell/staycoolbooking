-- Fix RLS policies for verifications table
-- Add INSERT policy for authenticated users to submit their own verifications
-- Add UPDATE policy for admins to approve/reject verifications

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can insert own verifications" ON public.verifications;
DROP POLICY IF EXISTS "Admins can update verifications" ON public.verifications;

-- Allow authenticated users to insert their own verification records
CREATE POLICY "Users can insert own verifications" 
ON public.verifications 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Allow admins to update verification statuses
CREATE POLICY "Admins can update verifications" 
ON public.verifications 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);
