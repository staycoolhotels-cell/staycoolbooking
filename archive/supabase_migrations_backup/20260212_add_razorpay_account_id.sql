-- Add razorpay_account_id to user_wallets table
ALTER TABLE public.user_wallets
ADD COLUMN IF NOT EXISTS razorpay_account_id TEXT;
