-- Ensure payment_transfers has a unique constraint on booking_id for upsert to work
ALTER TABLE public.payment_transfers 
ADD CONSTRAINT payment_transfers_booking_id_unique UNIQUE (booking_id);

-- Ensure razorpay_order_id is indexed for fast lookups by webhooks
CREATE INDEX IF NOT EXISTS idx_payment_transfers_razorpay_order ON public.payment_transfers(razorpay_order_id);

-- Ensure razorpay_payment_id is indexed for fast lookups by settled webhooks
CREATE INDEX IF NOT EXISTS idx_payment_transfers_razorpay_payment ON public.payment_transfers(razorpay_payment_id);
