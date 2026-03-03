-- Add razorpay_account_id column if it does not exist
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

-- Ensure RLS is enabled and policies are correct
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own wallet
DROP POLICY IF EXISTS "Users can view own wallet" ON public.user_wallets;
CREATE POLICY "Users can view own wallet"
ON public.user_wallets
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to update their own wallet (needed for onboarding)
DROP POLICY IF EXISTS "Users can update own wallet" ON public.user_wallets;
CREATE POLICY "Users can update own wallet"
ON public.user_wallets
FOR UPDATE
USING (auth.uid() = user_id);

-- Grant permissions (just in case)
GRANT ALL ON TABLE public.user_wallets TO authenticated;
GRANT ALL ON TABLE public.user_wallets TO service_role;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
