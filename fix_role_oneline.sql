-- Step 1: Add default value to the role column
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'guest';

-- Step 2: Update any existing NULL role values to 'guest'
UPDATE public.users SET role = 'guest' WHERE role IS NULL;

-- Step 3: Replace the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN INSERT INTO public.users (id, name, email, role) VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.email, COALESCE(NEW.raw_user_meta_data->>'role', 'guest')) ON CONFLICT (id) DO NOTHING; RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Recreate triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users; DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users; CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
