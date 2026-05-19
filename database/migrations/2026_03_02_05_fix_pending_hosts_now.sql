-- ============================================================
-- FIX: Approve all pending hosts immediately
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Step 1: See which hosts are still pending
SELECT id, name, email, role, status, created_at
FROM public.users
WHERE role = 'host' AND status = 'pending';

-- Step 2: Approve ALL pending hosts (uncomment to run)
-- UPDATE public.users
-- SET status = 'active'
-- WHERE role = 'host' AND status = 'pending';

-- Step 3: Approve a SPECIFIC host by email (replace with actual email)
-- UPDATE public.users
-- SET status = 'active'
-- WHERE email = 'host@example.com';

-- Step 4: Verify the fix
-- SELECT id, name, email, role, status FROM public.users WHERE role = 'host';
