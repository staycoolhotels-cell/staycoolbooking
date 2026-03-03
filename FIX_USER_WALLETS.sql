-- FIX: Ensure user_wallets exists with correct columns and RLS policies
-- Run this in your Supabase SQL Editor

-- 1. Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_wallets (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    razorpay_account_id TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Safely add missing columns if the table already existed but was missing them
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_wallets' AND column_name = 'razorpay_account_id') THEN
        ALTER TABLE public.user_wallets ADD COLUMN razorpay_account_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_wallets' AND column_name = 'updated_at') THEN
        ALTER TABLE public.user_wallets ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- 4. Drop any existing policies that might conflict
DROP POLICY IF EXISTS "Users can view their own wallet" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can insert their own wallet" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can update their own wallet" ON public.user_wallets;

-- 5. Create proper RLS policies for authenticated users
CREATE POLICY "Users can view their own wallet"
    ON public.user_wallets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet"
    ON public.user_wallets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet"
    ON public.user_wallets FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 6. Grant necessary permissions
GRANT ALL ON TABLE public.user_wallets TO authenticated;
GRANT ALL ON TABLE public.user_wallets TO service_role;

-- 7. Verify message
SELECT 'SUCCESS: user_wallets table and RLS policies configured!' as status;
