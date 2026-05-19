-- Enable RLS for the "wishlist" table if not already enabled
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users can insert their own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users can update their own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users can delete their own wishlist" ON public.wishlist;

-- 1. Allow users to SELECT their own matching user_id rows
CREATE POLICY "Users can view their own wishlist" 
ON public.wishlist FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Allow users to INSERT their own matching user_id rows
CREATE POLICY "Users can insert their own wishlist" 
ON public.wishlist FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. Allow users to UPDATE their own matching user_id rows
CREATE POLICY "Users can update their own wishlist" 
ON public.wishlist FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 4. Allow users to DELETE their own matching user_id rows
CREATE POLICY "Users can delete their own wishlist" 
ON public.wishlist FOR DELETE 
USING (auth.uid() = user_id);
