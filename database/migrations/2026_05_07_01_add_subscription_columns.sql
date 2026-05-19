-- Add subscription columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMP WITH TIME ZONE;

-- Update existing active hosts to have a 1-year subscription if they don't have one (for migration)
UPDATE public.users 
SET subscription_status = 'active', 
    subscription_expiry = created_at + interval '1 year'
WHERE role = 'host' AND status = 'active' AND subscription_expiry IS NULL;
