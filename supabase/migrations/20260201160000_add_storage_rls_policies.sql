-- Policy for 'images' bucket to allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads to images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- Policy for 'documents' bucket to allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads to documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');
