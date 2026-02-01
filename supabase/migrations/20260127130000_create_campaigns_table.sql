CREATE TABLE public.campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text,
  status text DEFAULT 'draft'::text,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  budget numeric,
  spend numeric,
  conversions integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT campaigns_pkey PRIMARY KEY (id)
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access for service_role"
ON public.campaigns FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow read access for authenticated users"
ON public.campaigns FOR SELECT
USING (auth.role() = 'authenticated');
