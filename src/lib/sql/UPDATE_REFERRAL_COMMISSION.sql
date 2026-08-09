-- Add referral_commissions_remaining column to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_commissions_remaining INTEGER DEFAULT 0;

-- Update get_commission_for_booking to handle referrer split
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
    v_total_commission NUMERIC;
    v_admin_commission NUMERIC;
    v_referrer_commission NUMERIC := 0;
    v_type TEXT;
    v_value NUMERIC;
    v_referrer_id UUID;
    v_commissions_remaining INTEGER;
BEGIN
    -- Get host_id for the property
    SELECT host_id INTO v_host_id
    FROM public.properties
    WHERE id = p_property_id;

    -- Get referral info for the host
    SELECT referred_by, referral_commissions_remaining 
    INTO v_referrer_id, v_commissions_remaining
    FROM public.users
    WHERE id = v_host_id;

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

    -- Calculate TOTAL commission amount
    IF v_type = 'percentage' THEN
        v_total_commission := ROUND((p_total_price * v_value / 100)::NUMERIC, 2);
    ELSE
        v_total_commission := LEAST(v_value, p_total_price); -- fixed, but never exceeds total
    END IF;

    -- Handle Referrer Split (5% to Referrer, rest to Admin)
    -- Only if Host 2 was referred and has remaining referral bookings
    IF v_referrer_id IS NOT NULL AND v_commissions_remaining > 0 THEN
        -- Calculate 5% for referrer
        v_referrer_commission := ROUND((p_total_price * 0.05)::NUMERIC, 2);
        
        -- Admin gets the rest of the total commission
        -- If total commission is less than 5% (unlikely but possible with custom rules), 
        -- referrer gets it all and admin gets 0? Or split differently?
        -- User said: "20% lo nunchi 5% host 1 ki... migitha 15% admin deggare undali".
        -- This implies a 25/75 split of the 20% commission.
        -- Let's just subtract 5% from total price for referrer, and the rest of the commission goes to Admin.
        v_admin_commission := GREATEST(0, v_total_commission - v_referrer_commission);
    ELSE
        v_admin_commission := v_total_commission;
        v_referrer_commission := 0;
    END IF;

    RETURN jsonb_build_object(
        'total_commission_amount', v_total_commission,
        'admin_commission_amount', v_admin_commission,
        'referrer_commission_amount', v_referrer_commission,
        'referrer_id', v_referrer_id,
        'host_amount', ROUND((p_total_price - v_total_commission)::NUMERIC, 2),
        'commission_type', v_type,
        'commission_value', v_value
    );
END;
$$;
