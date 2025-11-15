-- Create pack_likes table to track user likes on packs
CREATE TABLE IF NOT EXISTS public.pack_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id UUID NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, pack_id)
);

-- Enable RLS
ALTER TABLE public.pack_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view pack likes"
  ON public.pack_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like packs"
  ON public.pack_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike packs"
  ON public.pack_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_pack_likes_pack_id ON public.pack_likes(pack_id);
CREATE INDEX IF NOT EXISTS idx_pack_likes_user_id ON public.pack_likes(user_id);

-- Create function to update likes_count on packs table
CREATE OR REPLACE FUNCTION update_pack_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.packs
    SET likes_count = likes_count + 1
    WHERE id = NEW.pack_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.packs
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.pack_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update likes_count
DROP TRIGGER IF EXISTS pack_likes_count_trigger ON public.pack_likes;
CREATE TRIGGER pack_likes_count_trigger
  AFTER INSERT OR DELETE ON public.pack_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_pack_likes_count();
