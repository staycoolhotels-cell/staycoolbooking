-- Add Stripe columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS stripe_account_id text,
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_onboarding_completed boolean DEFAULT false;

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id),
  amount numeric NOT NULL, -- Total amount in smallest currency unit (e.g., cents)
  currency text DEFAULT 'usd',
  status text DEFAULT 'pending', -- pending, succeeded, failed
  stripe_payment_intent_id text,
  commission_amount numeric,
  host_payout_amount numeric,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id)
);

-- Enable RLS for payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own payments (as guest)
CREATE POLICY "Guests can view their own payments"
ON public.payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = public.payments.booking_id
    AND b.guest_id = auth.uid()
  )
);

-- Create policy to allow hosts to view payments for their bookings
CREATE POLICY "Hosts can view payments for their properties"
ON public.payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.properties p ON b.property_id = p.id
    WHERE b.id = public.payments.booking_id
    AND p.host_id = auth.uid()
  )
);

-- Create payouts table (for record keeping of transfers)
CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  host_id uuid REFERENCES public.users(id),
  amount numeric NOT NULL,
  currency text DEFAULT 'usd',
  stripe_transfer_id text,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payouts_pkey PRIMARY KEY (id)
);

-- Enable RLS for payouts
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow hosts to view their own payouts
CREATE POLICY "Hosts can view their own payouts"
ON public.payouts FOR SELECT
USING (auth.uid() = host_id);

-- Update bookings table to link payment status if needed (optional since we have payments table, but good for quick access)
-- ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';
