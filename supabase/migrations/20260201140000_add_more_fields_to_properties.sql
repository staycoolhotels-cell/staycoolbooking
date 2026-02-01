ALTER TABLE public.properties
ADD COLUMN weekendPrice numeric,
ADD COLUMN type text,
ADD COLUMN capacity integer,
ADD COLUMN bedrooms integer,
ADD COLUMN bathrooms integer,
ADD COLUMN max_guests integer,
ADD COLUMN "cancellationPolicy" text,
ADD COLUMN rules jsonb,
ADD COLUMN images jsonb;
