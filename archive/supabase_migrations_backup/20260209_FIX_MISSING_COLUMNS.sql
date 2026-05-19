
-- 1. Add missing columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS stripe_account_id text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS stripe_onboarding_completed boolean DEFAULT false;

-- 2. Create payments table if not exists
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    booking_id uuid REFERENCES public.bookings(id),
    amount numeric NOT NULL,
    currency text DEFAULT 'usd',
    status text DEFAULT 'pending',
    stripe_payment_intent_id text,
    stripe_transfer_id text,
    commission_amount numeric,
    host_payout_amount numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT payments_pkey PRIMARY KEY (id)
);

-- 3. Create payouts table if not exists
CREATE TABLE IF NOT EXISTS public.payouts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    host_id uuid REFERENCES public.users(id),
    amount numeric NOT NULL,
    currency text DEFAULT 'usd',
    status text DEFAULT 'pending',
    stripe_payout_id text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT payouts_pkey PRIMARY KEY (id)
);

-- 4. Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- 5. Add Policies (Simple ones for now)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can view their own payments') THEN
        CREATE POLICY "Users can view their own payments" ON public.payments
        FOR SELECT USING (
            auth.uid() IN (
                SELECT guest_id FROM bookings WHERE bookings.id = payments.booking_id
            ) OR 
            auth.uid() IN (
                SELECT host_id FROM properties WHERE properties.id = (
                    SELECT property_id FROM bookings WHERE bookings.id = payments.booking_id
                )
            )
        );
    END IF;
END $$;

-- 6. Emergency Data Fix for Test Host
-- This ensures the host '38ac5294...' is ready for payment testing
UPDATE public.users 
SET stripe_account_id = 'acct_test_12345', stripe_onboarding_completed = true 
WHERE id = '38ac5294-564b-45ba-ab18-035f59c30e19';

