-- Enforce single account per email and single account per mobile number
-- 1. Clean up duplicate emails (keep the one with the earliest created_at or lowest id)
DELETE FROM public.users a USING public.users b
WHERE a.id > b.id AND LOWER(a.email) = LOWER(b.email);

-- 2. Clean up duplicate phone numbers (keep the one with the earliest created_at or lowest id)
DELETE FROM public.users a USING public.users b
WHERE a.id > b.id AND a.phone = b.phone AND a.phone IS NOT NULL;

-- 3. Add unique constraint for email on public.users
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_email_key,
DROP CONSTRAINT IF EXISTS users_email_unique;

ALTER TABLE public.users 
ADD CONSTRAINT users_email_unique UNIQUE (email);

-- 4. Add unique constraint for phone on public.users
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_phone_key,
DROP CONSTRAINT IF EXISTS users_phone_unique;

ALTER TABLE public.users 
ADD CONSTRAINT users_phone_unique UNIQUE (phone);

-- 5. Force reload schema cache for PostgREST to immediately recognize constraints
NOTIFY pgrst, 'reload schema';
