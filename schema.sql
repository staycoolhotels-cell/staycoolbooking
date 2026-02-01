-- Create the "properties" table
CREATE TABLE public.properties (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  tier text,
  status text DEFAULT 'pending'::text,
  host_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT properties_pkey PRIMARY KEY (id)
);

-- Enable RLS for the "properties" table
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to read active properties
CREATE POLICY "Enable read access for all active properties"
ON public.properties FOR SELECT
USING (status = 'active');

CREATE POLICY "Allow admins to read all properties"
ON public.properties FOR SELECT
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- Create the "users" table
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text,
  email text,
  avatar_url text,
  status text DEFAULT 'pending'::text,
  role text,
  total_bookings integer DEFAULT 0,
  avatar_alt text,
  completion_percentage integer DEFAULT 0,
  kyc_status text DEFAULT 'not_verified'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Create the "verifications" table
CREATE TABLE public.verifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id),
  type text,
  status text DEFAULT 'pending'::text,
  document_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT verifications_pkey PRIMARY KEY (id)
);

-- Create the "disputes" table
CREATE TABLE public.disputes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  "caseNumber" text NOT NULL,
  "guestName" text NOT NULL,
  "hostName" text NOT NULL,
  "propertyName" text NOT NULL,
  "issueType" text NOT NULL,
  priority text NOT NULL,
  status text NOT NULL,
  "createdDate" timestamp with time zone NOT NULL,
  "lastUpdate" timestamp with time zone NOT NULL,
  CONSTRAINT disputes_pkey PRIMARY KEY (id)
);

-- Create the "transactions" table
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid,
  guest_id uuid,
  host_id uuid,
  property_id uuid,
  amount numeric,
  platform_fee numeric,
  host_payout numeric,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id)
);

-- Create the "reviews" table
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid,
  property_id uuid,
  guest_id uuid,
  rating integer,
  comment text,
  status text DEFAULT 'published'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id)
);

-- Create the "activities" table
CREATE TABLE public.activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type text,
  description text,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT activities_pkey PRIMARY KEY (id)
);

-- Create the "stats" table
CREATE TABLE public.stats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  label text,
  value text,
  icon text,
  trend text,
  CONSTRAINT stats_pkey PRIMARY KEY (id)
);

-- Create the "bookings" table
CREATE TABLE public.bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  guest_id uuid REFERENCES public.users(id),
  property_id uuid REFERENCES public.properties(id),
  check_in timestamp with time zone NOT NULL,
  check_out timestamp with time zone NOT NULL,
  total_price numeric,
  status text DEFAULT 'pending'::text,
  guests integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bookings_pkey PRIMARY KEY (id)
);

-- Create the "user_personal_info" table
CREATE TABLE public.user_personal_info (
  user_id uuid NOT NULL REFERENCES public.users(id),
  bio text,
  languages text[],
  location text,
  date_of_birth date,
  nationality text,
  gender text,
  occupation text,
  CONSTRAINT user_personal_info_pkey PRIMARY KEY (user_id)
);

-- Create the "user_achievements" table
CREATE TABLE public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id),
  type text,
  title text,
  description text,
  date_awarded timestamp with time zone,
  icon text,
  CONSTRAINT user_achievements_pkey PRIMARY KEY (id)
);

-- Create the "preferences" table
CREATE TABLE public.preferences (
  user_id uuid NOT NULL REFERENCES public.users(id),
  email_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT false,
  instant_book boolean DEFAULT false,
  currency text DEFAULT 'USD'::text,
  language text DEFAULT 'en-US'::text,
  timezone text,
  CONSTRAINT preferences_pkey PRIMARY KEY (user_id)
);

-- Create the "wishlist" table
CREATE TABLE public.wishlist (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id),
  property_id uuid REFERENCES public.properties(id),
  board text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT wishlist_pkey PRIMARY KEY (id),
  CONSTRAINT wishlist_user_property_unique UNIQUE (user_id, property_id)
);

-- Function to create or update a public.users entry when an auth.user is created or updated
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, avatar_url, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.email, NEW.raw_user_meta_data->>'avatar_url', COALESCE(NEW.raw_user_meta_data->>'role', 'guest'))
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    avatar_url = EXCLUDED.avatar_url,
    role = COALESCE(EXCLUDED.role, 'guest');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created or updated in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users; -- Clean up old trigger
CREATE TRIGGER on_auth_user_updated
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- Enable RLS for the "users" table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own data
CREATE POLICY "Users can read their own data"
ON public.users FOR SELECT
USING (auth.uid() = id);

-- Create policy to allow users to update their own data
CREATE POLICY "Users can update their own data"
ON public.users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create policy to allow service_role to perform all operations
CREATE POLICY "Allow full access for service_role"
ON public.users FOR ALL
USING (true)
WITH CHECK (true);
