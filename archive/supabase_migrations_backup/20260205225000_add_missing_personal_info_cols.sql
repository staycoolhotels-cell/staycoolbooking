ALTER TABLE public.user_personal_info
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS occupation text,
ADD COLUMN IF NOT EXISTS nationality text,
ADD COLUMN IF NOT EXISTS gender text;
