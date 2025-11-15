-- Add musical_key column to packs table
ALTER TABLE public.packs
ADD COLUMN IF NOT EXISTS musical_key TEXT;

-- Add total_plays_count to profiles for statistics
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS total_plays_count INTEGER DEFAULT 0;

-- Add total_likes_received to profiles for statistics
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS total_likes_received INTEGER DEFAULT 0;

-- Create function to update profile stats when pack is liked
CREATE OR REPLACE FUNCTION update_profile_likes_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET total_likes_received = total_likes_received + 1
    WHERE id = (SELECT user_id FROM public.packs WHERE id = NEW.pack_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
    SET total_likes_received = GREATEST(0, total_likes_received - 1)
    WHERE id = (SELECT user_id FROM public.packs WHERE id = OLD.pack_id);
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update profile likes stats
DROP TRIGGER IF EXISTS profile_likes_stats_trigger ON public.pack_likes;
CREATE TRIGGER profile_likes_stats_trigger
  AFTER INSERT OR DELETE ON public.pack_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_likes_stats();

-- Create function to update profile plays stats
CREATE OR REPLACE FUNCTION update_profile_plays_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET total_plays_count = total_plays_count + 1
  WHERE id = (SELECT user_id FROM public.packs WHERE id = NEW.pack_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update profile plays stats
DROP TRIGGER IF EXISTS profile_plays_stats_trigger ON public.pack_plays;
CREATE TRIGGER profile_plays_stats_trigger
  AFTER INSERT ON public.pack_plays
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_plays_stats();
