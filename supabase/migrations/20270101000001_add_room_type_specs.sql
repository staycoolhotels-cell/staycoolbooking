-- Migration: Add room_type_specs JSONB column to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS room_type_specs JSONB DEFAULT '{}'::JSONB;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
