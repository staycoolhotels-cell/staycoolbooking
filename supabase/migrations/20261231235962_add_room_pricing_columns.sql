-- Migration: Add room type pricing columns to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS room_type_prices JSONB DEFAULT '{}'::JSONB;

ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS room_type_weekend_prices JSONB DEFAULT '{}'::JSONB;

-- Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';

