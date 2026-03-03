-- ============================================================
-- WISHLIST BOARD FIX
-- ============================================================
-- Adds a `board` TEXT column to the wishlist table so that
-- board assignments persist in the database across refreshes
-- and devices.
-- ============================================================

ALTER TABLE public.wishlist
  ADD COLUMN IF NOT EXISTS board TEXT DEFAULT NULL;
