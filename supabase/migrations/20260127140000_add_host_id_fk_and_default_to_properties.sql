-- Add foreign key constraint to properties.host_id
ALTER TABLE public.properties
ADD CONSTRAINT fk_host_id
FOREIGN KEY (host_id) REFERENCES public.users(id);

-- Set default value for host_id to auth.uid()
ALTER TABLE public.properties
ALTER COLUMN host_id SET DEFAULT auth.uid();