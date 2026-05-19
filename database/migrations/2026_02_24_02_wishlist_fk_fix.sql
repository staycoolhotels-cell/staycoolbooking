-- ============================================================
-- WISHLIST FK FIX
-- ============================================================
-- Problem: wishlist.user_id has a FK to profiles.id, but most
-- users don't have a row in the profiles table, causing:
--   "insert or update on table wishlist violates foreign key
--    constraint wishlist_user_id_fkey"
--
-- Fix: Drop the FK to profiles.id and re-point it to auth.users.id
-- so ANY authenticated user can add to their wishlist.
-- ============================================================

-- Step 1: Drop the old FK constraint
ALTER TABLE public.wishlist
  DROP CONSTRAINT IF EXISTS wishlist_user_id_fkey;

-- Step 2: Add a new FK pointing to auth.users.id
ALTER TABLE public.wishlist
  ADD CONSTRAINT wishlist_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- ============================================================
-- Add missing reward_points column to profiles (if missing)
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS reward_points INTEGER NOT NULL DEFAULT 0;

-- ============================================================
-- Auto-create profiles row on user signup (for reward_points)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role, reward_points, created_at)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    'guest',
    0,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_profile();

-- ============================================================
-- Backfill: Create profiles rows for existing users who are
-- missing one (required so wishlist queries won't break for
-- users who signed up before this fix)
-- ============================================================
INSERT INTO public.profiles (id, full_name, email, avatar_url, role, reward_points, created_at)
SELECT
  u.id,
  u.raw_user_meta_data->>'name',
  u.email,
  u.raw_user_meta_data->>'avatar_url',
  COALESCE(pu.role, 'guest'),
  0,
  u.created_at
FROM auth.users u
LEFT JOIN public.users pu ON pu.id = u.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;
