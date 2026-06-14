-- Migration: Add standard_price column to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS standard_price INTEGER;

-- Initialize standard_price to the current price_per_night
UPDATE public.properties 
SET standard_price = price_per_night 
WHERE standard_price IS NULL;

-- Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
