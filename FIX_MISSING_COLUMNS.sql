-- ============================================================================
-- FIX: Add missing columns to properties table + reload schema cache
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================================

-- Step 1: Add all missing columns (safe – uses IF NOT EXISTS)
ALTER TABLE public.properties
    ADD COLUMN IF NOT EXISTS aadhar_url            text DEFAULT '',
    ADD COLUMN IF NOT EXISTS pan_url               text DEFAULT '',
    ADD COLUMN IF NOT EXISTS noc_url               text DEFAULT '',
    ADD COLUMN IF NOT EXISTS images                jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS cancellation_policy   text DEFAULT '',
    ADD COLUMN IF NOT EXISTS rules                 jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS safety_items          jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS beds                  integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_rooms           integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS room_type             text DEFAULT '',
    ADD COLUMN IF NOT EXISTS weekend_price_per_night numeric DEFAULT 0,
    ADD COLUMN IF NOT EXISTS co_host_name          text DEFAULT '',
    ADD COLUMN IF NOT EXISTS co_host_email         text DEFAULT '',
    ADD COLUMN IF NOT EXISTS address_line1         text DEFAULT '',
    ADD COLUMN IF NOT EXISTS address_line2         text DEFAULT '',
    ADD COLUMN IF NOT EXISTS landmark              text DEFAULT '',
    ADD COLUMN IF NOT EXISTS district              text DEFAULT '',
    ADD COLUMN IF NOT EXISTS city                  text DEFAULT '',
    ADD COLUMN IF NOT EXISTS state                 text DEFAULT '',
    ADD COLUMN IF NOT EXISTS postal_code           text DEFAULT '',
    ADD COLUMN IF NOT EXISTS country               text DEFAULT '',
    ADD COLUMN IF NOT EXISTS show_specific_location boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS updated_at            timestamptz DEFAULT now();

-- Step 2: Reload PostgREST schema cache (IMPORTANT)
NOTIFY pgrst, 'reload schema';

-- Step 3: Verify columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'properties'
ORDER BY ordinal_position;
