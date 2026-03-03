-- ============================================================
-- ENFORCE SINGLE ADMIN TRIGGER
-- Run this once in your Supabase SQL Editor (Dashboard > SQL Editor)
-- This prevents more than one user from having role='admin'
-- ============================================================

CREATE OR REPLACE FUNCTION prevent_multiple_admins()
RETURNS TRIGGER AS $$
BEGIN
  -- If the new row's role is 'admin' AND it's not the already-existing admin updating their own row
  IF NEW.role = 'admin' THEN
    IF EXISTS (
      SELECT 1 FROM users WHERE role = 'admin' AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'Only one admin is allowed in the system. Demote the current admin first.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if it exists, then create fresh
DROP TRIGGER IF EXISTS enforce_single_admin ON users;

CREATE TRIGGER enforce_single_admin
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION prevent_multiple_admins();
