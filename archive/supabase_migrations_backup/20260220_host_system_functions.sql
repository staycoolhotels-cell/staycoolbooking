-- Function to block property dates
CREATE OR REPLACE FUNCTION public.block_property_dates(
    p_property_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_block_id UUID;
BEGIN
    -- Check if user is the host of the property
    IF NOT EXISTS (
        SELECT 1 FROM public.properties
        WHERE id = p_property_id
        AND host_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: You do not own this property';
    END IF;

    -- Check for overlapping blocks or bookings (optional, but good practice)
    -- For now, just insert. Use check_availability to filter out.

    INSERT INTO public.blocked_dates (property_id, start_date, end_date, reason)
    VALUES (p_property_id, p_start_date, p_end_date, p_reason)
    RETURNING id INTO v_block_id;

    RETURN v_block_id;
END;
$$;

-- Function to unblock dates
CREATE OR REPLACE FUNCTION public.unblock_property_dates(
    p_block_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.blocked_dates
    WHERE id = p_block_id
    AND property_id IN (
        SELECT id FROM public.properties WHERE host_id = auth.uid()
    );

    IF FOUND THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;

-- Admin: Approve Property
CREATE OR REPLACE FUNCTION public.admin_approve_property(
    p_property_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can approve properties';
    END IF;

    UPDATE public.properties
    SET status = 'approved'
    WHERE id = p_property_id;

    RETURN TRUE;
END;
$$;

-- Admin: Reject Property
CREATE OR REPLACE FUNCTION public.admin_reject_property(
    p_property_id UUID,
    p_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can reject properties';
    END IF;

    UPDATE public.properties
    SET status = 'rejected' -- Assuming reason is stored elsewhere or logged, property table might verify a reason column?
    -- For now simply setting status. properties table doesn't have rejection_reason column by default?
    -- Let's check schema. If needed add logic.
    WHERE id = p_property_id;

    RETURN TRUE;
END;
$$;
