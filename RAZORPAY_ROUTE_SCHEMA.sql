-- ============================================================
-- RAZORPAY ROUTE PAYMENT SPLIT SYSTEM — DATABASE MIGRATION
-- Run this entire script in your Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. HOST KYC DETAILS TABLE
-- Stores Razorpay linked account & banking info per host
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.host_kyc_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Business / Personal Info
    legal_business_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    pan_number TEXT NOT NULL,
    -- Bank Account Details
    bank_account_number TEXT NOT NULL,
    bank_ifsc TEXT NOT NULL,
    bank_beneficiary_name TEXT NOT NULL,
    -- Razorpay Route
    razorpay_account_id TEXT,
    razorpay_product_id TEXT,
    kyc_status TEXT DEFAULT 'pending' CHECK (
        kyc_status IN ('pending', 'under_review', 'activated', 'needs_clarification', 'suspended')
    ),
    kyc_error_message TEXT,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT host_kyc_details_user_id_unique UNIQUE (user_id)
);

-- RLS for host_kyc_details
ALTER TABLE public.host_kyc_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can view their own KYC details"
    ON public.host_kyc_details FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Hosts can insert their own KYC details"
    ON public.host_kyc_details FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Hosts can update their own KYC details"
    ON public.host_kyc_details FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all KYC details"
    ON public.host_kyc_details FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS host_kyc_details_updated_at ON public.host_kyc_details;
CREATE TRIGGER host_kyc_details_updated_at
    BEFORE UPDATE ON public.host_kyc_details
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ─────────────────────────────────────────────────────────────
-- 2. COMMISSION RULES TABLE
-- Supports: per-property or per-host, fixed or percentage
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.commission_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    commission_type TEXT NOT NULL CHECK (commission_type IN ('percentage', 'fixed')),
    commission_value NUMERIC(10, 2) NOT NULL CHECK (commission_value >= 0),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Ensure at least one scope is defined
    CONSTRAINT commission_scope_check CHECK (
        host_id IS NOT NULL OR property_id IS NOT NULL
    )
);

-- RLS for commission_rules
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage commission rules"
    ON public.commission_rules FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Hosts can view their own commission rules"
    ON public.commission_rules FOR SELECT
    TO authenticated
    USING (host_id = auth.uid());


-- ─────────────────────────────────────────────────────────────
-- 3. PAYMENT TRANSFERS TABLE
-- Tracks each Razorpay Route transfer tied to a booking
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    host_id UUID REFERENCES auth.users(id),
    -- Razorpay identifiers
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_transfer_id TEXT,
    -- Financial breakdown
    total_amount NUMERIC(12, 2) NOT NULL,
    platform_commission NUMERIC(12, 2) NOT NULL DEFAULT 0,
    host_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    commission_type TEXT CHECK (commission_type IN ('percentage', 'fixed')),
    commission_value NUMERIC(10, 2),
    -- Status
    transfer_status TEXT DEFAULT 'pending' CHECK (
        transfer_status IN ('pending', 'processing', 'settled', 'failed', 'reversed')
    ),
    failure_reason TEXT,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for payment_transfers
ALTER TABLE public.payment_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can view their own transfers"
    ON public.payment_transfers FOR SELECT
    TO authenticated
    USING (host_id = auth.uid());

CREATE POLICY "Guests can view transfers for their bookings"
    ON public.payment_transfers FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = booking_id AND b.guest_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all transfers"
    ON public.payment_transfers FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Service role can insert/update (used by API routes)
CREATE POLICY "Service role can insert payment_transfers"
    ON public.payment_transfers FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "Service role can update payment_transfers"
    ON public.payment_transfers FOR UPDATE
    TO service_role
    USING (true);

DROP TRIGGER IF EXISTS payment_transfers_updated_at ON public.payment_transfers;
CREATE TRIGGER payment_transfers_updated_at
    BEFORE UPDATE ON public.payment_transfers
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ─────────────────────────────────────────────────────────────
-- 4. UPDATE BOOKINGS TABLE
-- Add Razorpay tracking columns
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
    ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;


-- ─────────────────────────────────────────────────────────────
-- 5. COMMISSION CALCULATION FUNCTION
-- Returns platform commission (in ₹) for a given booking
-- Priority: property rule > host rule > default (20%)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_commission_for_booking(
    p_property_id UUID,
    p_total_price NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_host_id UUID;
    v_rule RECORD;
    v_commission NUMERIC;
    v_type TEXT;
    v_value NUMERIC;
BEGIN
    -- Get host_id for the property
    SELECT host_id INTO v_host_id
    FROM public.properties
    WHERE id = p_property_id;

    -- 1. Look for a property-level rule first
    SELECT commission_type, commission_value INTO v_rule
    FROM public.commission_rules
    WHERE property_id = p_property_id AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1;

    IF FOUND THEN
        v_type := v_rule.commission_type;
        v_value := v_rule.commission_value;
    ELSE
        -- 2. Fall back to host-level rule
        SELECT commission_type, commission_value INTO v_rule
        FROM public.commission_rules
        WHERE host_id = v_host_id AND property_id IS NULL AND is_active = true
        ORDER BY created_at DESC
        LIMIT 1;

        IF FOUND THEN
            v_type := v_rule.commission_type;
            v_value := v_rule.commission_value;
        ELSE
            -- 3. Platform default: 20% of total price
            v_type := 'percentage';
            v_value := 20;
        END IF;
    END IF;

    -- Calculate commission amount
    IF v_type = 'percentage' THEN
        v_commission := ROUND((p_total_price * v_value / 100)::NUMERIC, 2);
    ELSE
        v_commission := LEAST(v_value, p_total_price); -- fixed, but never exceeds total
    END IF;

    RETURN jsonb_build_object(
        'commission_amount', v_commission,
        'host_amount', ROUND((p_total_price - v_commission)::NUMERIC, 2),
        'commission_type', v_type,
        'commission_value', v_value
    );
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- 6. SEED: Default indexes
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_host_kyc_user_id ON public.host_kyc_details(user_id);
CREATE INDEX IF NOT EXISTS idx_commission_rules_property ON public.commission_rules(property_id);
CREATE INDEX IF NOT EXISTS idx_commission_rules_host ON public.commission_rules(host_id);
CREATE INDEX IF NOT EXISTS idx_payment_transfers_booking ON public.payment_transfers(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_transfers_host ON public.payment_transfers(host_id);
CREATE INDEX IF NOT EXISTS idx_payment_transfers_razorpay_payment ON public.payment_transfers(razorpay_payment_id);
