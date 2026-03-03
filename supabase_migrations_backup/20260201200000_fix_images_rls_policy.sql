-- Drop the existing permissive policy
DROP POLICY IF EXISTS "Allow authenticated access on images" ON storage.objects;

-- Allow authenticated users to see all images
CREATE POLICY "Allow authenticated read access on images"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'images' );

-- Allow authenticated users to insert images
CREATE POLICY "Allow authenticated insert on images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'images' AND auth.role() = 'authenticated' );

-- Allow users to update their own images
CREATE POLICY "Allow individual updates on images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'images' AND auth.uid() = owner );

-- Allow users to delete their own images
CREATE POLICY "Allow individual deletes on images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'images' AND auth.uid() = owner );
