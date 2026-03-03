-- Create the storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Create the storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create policies for the 'images' bucket
-- Allow public read access
CREATE POLICY "Allow public read access on images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'images' );

-- Allow authenticated users to upload, update, and delete
CREATE POLICY "Allow authenticated access on images"
ON storage.objects FOR ALL
TO authenticated
WITH CHECK ( bucket_id = 'images' );

-- Create policies for the 'documents' bucket
-- Disallow public read access (by default)
-- Allow authenticated users to upload, update, and delete their own documents
CREATE POLICY "Allow authenticated access on documents"
ON storage.objects FOR ALL
TO authenticated
WITH CHECK ( bucket_id = 'documents' );
