-- Create table to track free pack downloads
CREATE TABLE IF NOT EXISTS public.pack_downloads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pack_id UUID REFERENCES public.packs(id) ON DELETE CASCADE NOT NULL,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS pack_downloads_user_id_idx ON public.pack_downloads(user_id);
CREATE INDEX IF NOT EXISTS pack_downloads_pack_id_idx ON public.pack_downloads(pack_id);
CREATE INDEX IF NOT EXISTS pack_downloads_downloaded_at_idx ON public.pack_downloads(downloaded_at DESC);

-- Create compound index for counting user downloads in date range
CREATE INDEX IF NOT EXISTS pack_downloads_user_date_idx ON public.pack_downloads(user_id, downloaded_at);

-- RLS policies
ALTER TABLE public.pack_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own downloads"
  ON public.pack_downloads FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own downloads"
  ON public.pack_downloads FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Function to get user's download count in last 30 days
CREATE OR REPLACE FUNCTION get_user_download_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  download_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO download_count
  FROM public.pack_downloads
  WHERE user_id = p_user_id
    AND downloaded_at >= NOW() - INTERVAL '30 days';
  
  RETURN download_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can download free pack
CREATE OR REPLACE FUNCTION can_download_free_pack(p_user_id UUID, p_pack_id UUID)
RETURNS JSON AS $$
DECLARE
  user_plan TEXT;
  download_limit INTEGER;
  current_downloads INTEGER;
  pack_price INTEGER;
  result JSON;
BEGIN
  -- Get user's plan
  SELECT plan INTO user_plan
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- If no plan found, default to free
  IF user_plan IS NULL THEN
    user_plan := 'free';
  END IF;
  
  -- Get pack price
  SELECT price INTO pack_price
  FROM public.packs
  WHERE id = p_pack_id;
  
  -- If pack is not free (price > 0), check if user purchased it
  IF pack_price > 0 THEN
    IF EXISTS (
      SELECT 1 FROM public.purchases
      WHERE pack_id = p_pack_id AND buyer_id = p_user_id
    ) THEN
      result := json_build_object(
        'can_download', true,
        'reason', 'purchased'
      );
      RETURN result;
    ELSE
      result := json_build_object(
        'can_download', false,
        'reason', 'not_purchased',
        'message', 'Necesitás comprar este pack para descargarlo'
      );
      RETURN result;
    END IF;
  END IF;
  
  -- For paid plans (de_0_a_hit, studio_plus), unlimited downloads
  IF user_plan IN ('de_0_a_hit', 'studio_plus') THEN
    result := json_build_object(
      'can_download', true,
      'reason', 'unlimited_plan'
    );
    RETURN result;
  END IF;
  
  -- For free plan, check download limit (10 per month)
  download_limit := 10;
  
  SELECT COUNT(*)
  INTO current_downloads
  FROM public.pack_downloads
  WHERE user_id = p_user_id
    AND downloaded_at >= NOW() - INTERVAL '30 days';
  
  IF current_downloads >= download_limit THEN
    result := json_build_object(
      'can_download', false,
      'reason', 'limit_reached',
      'message', 'Alcanzaste el límite de 10 descargas gratuitas por mes. Mejorá tu plan para descargas ilimitadas.',
      'current_downloads', current_downloads,
      'limit', download_limit
    );
    RETURN result;
  END IF;
  
  result := json_build_object(
    'can_download', true,
    'reason', 'within_limit',
    'current_downloads', current_downloads,
    'limit', download_limit
  );
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
