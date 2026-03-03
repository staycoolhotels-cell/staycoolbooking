-- Drop the existing permissive policy
DROP POLICY IF EXISTS "Allow authenticated access on documents" ON storage.objects;

-- Allow authenticated users to see all documents
CREATE POLICY "Allow authenticated read access on documents"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'documents' );

-- Allow authenticated users to insert documents
CREATE POLICY "Allow authenticated insert on documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'documents' AND auth.role() = 'authenticated' );

-- Allow users to update their own documents
CREATE POLICY "Allow individual updates on documents"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'documents' AND auth.uid() = owner );

-- Allow users to delete their own documents
CREATE POLICY "Allow individual deletes on documents"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'documents' AND auth.uid() = owner );
