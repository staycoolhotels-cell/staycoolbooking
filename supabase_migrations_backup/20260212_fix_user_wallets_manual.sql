-- Fix user_wallets table and policies

-- 1. Ensure table exists
CREATE TABLE IF NOT EXISTS public.user_wallets (
    user_id uuid NOT NULL REFERENCES public.users(id),
    balance numeric(12,2) DEFAULT 0.00,
    currency character varying(10) DEFAULT 'INR',
    loyalty_points integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_wallets_pkey PRIMARY KEY (user_id)
);

-- 2. Add razorpay_account_id column if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_wallets'
        AND column_name = 'razorpay_account_id'
    ) THEN
        ALTER TABLE public.user_wallets ADD COLUMN razorpay_account_id TEXT;
    END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies
-- Allow users to view their own wallet
DROP POLICY IF EXISTS "Users can view own wallet" ON public.user_wallets;
CREATE POLICY "Users can view own wallet"
ON public.user_wallets
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to update their own wallet (if needed, e.g. for some status, but usually backend handles balance)
-- For now, read-only for frontend is sufficient, but let's add update just in case for linking
DROP POLICY IF EXISTS "Users can update own wallet" ON public.user_wallets;
CREATE POLICY "Users can update own wallet"
ON public.user_wallets
FOR UPDATE
USING (auth.uid() = user_id);

-- 5. Grant permissions
GRANT ALL ON TABLE public.user_wallets TO authenticated;
GRANT ALL ON TABLE public.user_wallets TO service_role;
