-- Add reward_points to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS reward_points INTEGER DEFAULT 0;

-- Create reward_history table
CREATE TABLE IF NOT EXISTS public.reward_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  change_amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.reward_history ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own history
CREATE POLICY "Users can view their own reward history"
  ON public.reward_history
  FOR SELECT
  USING (auth.uid() = profile_id);

-- Create trigger function to update profile points
CREATE OR REPLACE FUNCTION public.update_profile_reward_points()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET reward_points = reward_points + NEW.change_amount,
      updated_at = NOW()
  WHERE id = NEW.profile_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_reward_history_created ON public.reward_history;
CREATE TRIGGER on_reward_history_created
  AFTER INSERT ON public.reward_history
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_profile_reward_points();
