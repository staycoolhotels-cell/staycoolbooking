DROP POLICY IF EXISTS "Allow authenticated access on documents" ON storage.objects;

CREATE POLICY "Allow authenticated access on documents"
ON storage.objects FOR ALL
TO authenticated
WITH CHECK ( bucket_id = 'documents' );
