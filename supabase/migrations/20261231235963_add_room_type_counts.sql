-- Migration: Add room_type_counts column to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS room_type_counts JSONB DEFAULT '{}'::JSONB;

-- Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
