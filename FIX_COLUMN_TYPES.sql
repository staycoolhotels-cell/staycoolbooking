-- ============================================================================
-- FIX: Convert text[] columns to jsonb safely
-- Run this in your Supabase Dashboard → SQL Editor
-- ============================================================================
-- REASON: The properties table previously defined some columns like safety_items
-- as text[], but the new create_property function expects jsonb.
-- This script safely converts those columns if they are arrays.
-- ============================================================================

DO $$
DECLARE
    col_type text;
BEGIN
    -- 1. Check and convert safety_items
    SELECT data_type INTO col_type FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'safety_items';
    
    IF col_type = 'ARRAY' THEN
        ALTER TABLE public.properties ALTER COLUMN safety_items DROP DEFAULT;
        ALTER TABLE public.properties ALTER COLUMN safety_items TYPE jsonb USING array_to_json(safety_items)::jsonb;
        ALTER TABLE public.properties ALTER COLUMN safety_items SET DEFAULT '[]'::jsonb;
    END IF;

    -- 2. Check and convert rules
    SELECT data_type INTO col_type FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'rules';
    
    IF col_type = 'ARRAY' THEN
        ALTER TABLE public.properties ALTER COLUMN rules DROP DEFAULT;
        ALTER TABLE public.properties ALTER COLUMN rules TYPE jsonb USING array_to_json(rules)::jsonb;
        ALTER TABLE public.properties ALTER COLUMN rules SET DEFAULT '[]'::jsonb;
    END IF;

    -- 3. Check and convert amenities
    SELECT data_type INTO col_type FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'amenities';
    
    IF col_type = 'ARRAY' THEN
        ALTER TABLE public.properties ALTER COLUMN amenities DROP DEFAULT;
        ALTER TABLE public.properties ALTER COLUMN amenities TYPE jsonb USING array_to_json(amenities)::jsonb;
        ALTER TABLE public.properties ALTER COLUMN amenities SET DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
