ALTER TABLE public.properties
ADD COLUMN tier TEXT,
ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
