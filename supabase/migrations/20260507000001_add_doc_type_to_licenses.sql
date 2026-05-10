-- Add doc_type column to licenses table to track which document the license belongs to
ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS doc_type TEXT;
