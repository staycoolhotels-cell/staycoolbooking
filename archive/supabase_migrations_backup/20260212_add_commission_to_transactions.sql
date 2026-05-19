-- Add commission and split columns to transactions table
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS gst_on_commission NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS net_host_payout NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS admin_receivable NUMERIC(10, 2);
