
-- Enable RLS for the "properties" table
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to active properties
CREATE POLICY "Allow public read access to active properties"
ON public.properties FOR SELECT
USING (status = 'active'::text);

-- Create policy to allow hosts to insert their own properties
CREATE POLICY "Allow hosts to insert their own properties"
ON public.properties FOR INSERT
WITH CHECK (auth.uid() = host_id);

-- Create policy to allow hosts to update their own properties
CREATE POLICY "Allow hosts to update their own properties"
ON public.properties FOR UPDATE
USING (auth.uid() = host_id);

-- Create policy to allow hosts to delete their own properties
CREATE POLICY "Allow hosts to delete their own properties"
ON public.properties FOR DELETE
USING (auth.uid() = host_id);

-- Create policy to allow hosts to select their own properties
CREATE POLICY "Allow hosts to select their own properties"
ON public.properties FOR SELECT
USING (auth.uid() = host_id);
