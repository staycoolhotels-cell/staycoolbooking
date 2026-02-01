ALTER TABLE public.properties
ADD COLUMN rejection_reason TEXT;

ALTER TABLE public.properties
ADD CONSTRAINT properties_status_check CHECK (status IN ('pending', 'active', 'rejected'));
