-- Allow anyone to view active amenities for booking upsells
CREATE POLICY "Anyone can view active amenities"
ON public.amenities FOR SELECT
USING (is_active = true);
