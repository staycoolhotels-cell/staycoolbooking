-- 0. Create exec_sql helper function (Security Definer)
-- This allows the setup API to execute arbitrary SQL as an admin
CREATE OR REPLACE FUNCTION public.exec_sql(sql_string text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_string;
END;
$$;

-- 1. Create the "disputes" table with all required columns
-- Using quoted identifiers for camelCase to match existing frontend expectations
CREATE TABLE IF NOT EXISTS public.disputes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  "caseNumber" text NOT NULL,
  "guestName" text NOT NULL,
  "hostName" text NOT NULL,
  "propertyName" text NOT NULL,
  "issueType" text NOT NULL,
  priority text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  "createdDate" timestamp with time zone DEFAULT now(),
  "lastUpdate" timestamp with time zone DEFAULT now(),
  booking_id uuid REFERENCES public.bookings(id),
  guest_id uuid REFERENCES public.users(id),
  host_id uuid REFERENCES public.users(id),
  property_id uuid REFERENCES public.properties(id),
  description text,
  host_response text,
  CONSTRAINT disputes_pkey PRIMARY KEY (id)
);

-- 2. Enable Row Level Security
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Allow users to see disputes where they are the guest or host
DROP POLICY IF EXISTS "Users can view their own disputes" ON public.disputes;
CREATE POLICY "Users can view their own disputes"
ON public.disputes FOR SELECT
USING (
  auth.uid() = guest_id OR 
  auth.uid() = host_id OR
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- Allow guests and hosts to insert disputes
DROP POLICY IF EXISTS "Guests and Hosts can create disputes" ON public.disputes;
CREATE POLICY "Guests and Hosts can create disputes"
ON public.disputes FOR INSERT
WITH CHECK (
  auth.uid() = guest_id OR 
  auth.uid() = host_id
);

-- Allow hosts to update disputes
DROP POLICY IF EXISTS "Hosts can update their disputes" ON public.disputes;
CREATE POLICY "Hosts can update their disputes"
ON public.disputes FOR UPDATE
USING (
  auth.uid() = host_id OR
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- 4. Grant Privileges
GRANT ALL ON TABLE public.disputes TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated, service_role;

-- 5. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
