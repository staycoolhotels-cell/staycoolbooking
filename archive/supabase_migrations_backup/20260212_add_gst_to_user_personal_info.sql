-- Add gst_number column to user_personal_info table
ALTER TABLE public.user_personal_info
ADD COLUMN IF NOT EXISTS gst_number TEXT;
