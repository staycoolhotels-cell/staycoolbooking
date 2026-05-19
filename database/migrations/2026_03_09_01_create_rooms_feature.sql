-- Create rooms table
CREATE TABLE IF NOT EXISTS public.rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  room_number text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rooms_pkey PRIMARY KEY (id),
  CONSTRAINT rooms_property_id_room_number_key UNIQUE (property_id, room_number)
);

-- Enable RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policy for safety
DROP POLICY IF EXISTS "Enable read access for all rooms" ON public.rooms;
CREATE POLICY "Enable read access for all rooms"
ON public.rooms FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow admins to modify rooms" ON public.rooms;
CREATE POLICY "Allow admins to modify rooms"
ON public.rooms FOR ALL
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'host')
);

-- Alter bookings table to have room_id
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS room_id uuid REFERENCES public.rooms(id);

-- Function to get availability
CREATE OR REPLACE FUNCTION get_property_rooms_availability(
  p_property_id uuid,
  p_check_in date,
  p_check_out date
)
RETURNS TABLE (
  id uuid,
  room_number text,
  is_available boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.room_number,
    NOT EXISTS (
      SELECT 1 
      FROM public.bookings b
      WHERE b.room_id = r.id
        AND b.status IN ('pending', 'confirmed')
        AND b.check_in::date < p_check_out 
        AND b.check_out::date > p_check_in
    ) AS is_available
  FROM public.rooms r
  WHERE r.property_id = p_property_id
  ORDER BY r.room_number ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
