-- Create pack_uploads table to track uploads for each user
CREATE TABLE IF NOT EXISTS public.pack_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pack_id uuid NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now(),
  deleted_at timestamp,
  UNIQUE(user_id, pack_id)
);

-- Enable RLS
ALTER TABLE public.pack_uploads ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own uploads"
  ON public.pack_uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own uploads"
  ON public.pack_uploads FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'authenticated');

-- Create function to get remaining downloads for free plan users
CREATE OR REPLACE FUNCTION public.get_remaining_downloads(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  v_plan text;
  v_downloads_limit integer;
  v_current_downloads integer;
BEGIN
  -- Get user's plan
  SELECT plan INTO v_plan FROM public.profiles WHERE id = p_user_id;
  
  -- If plan is not free, return unlimited
  IF v_plan != 'free' THEN
    RETURN 999999; -- Large number for unlimited
  END IF;
  
  -- For free plan, return 10 - current downloads this month
  SELECT COUNT(*) INTO v_current_downloads 
  FROM public.pack_downloads 
  WHERE user_id = p_user_id 
    AND created_at >= DATE_TRUNC('month', NOW());
  
  RETURN GREATEST(0, 10 - v_current_downloads);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get remaining uploads for users
CREATE OR REPLACE FUNCTION public.get_remaining_uploads(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  v_plan text;
  v_uploads_limit integer;
  v_current_uploads integer;
BEGIN
  -- Get user's plan
  SELECT plan INTO v_plan FROM public.profiles WHERE id = p_user_id;
  
  -- Determine limit based on plan
  CASE v_plan
    WHEN 'free' THEN v_uploads_limit := 3;
    WHEN 'de_0_a_hit' THEN v_uploads_limit := 10;
    WHEN 'studio_plus' THEN v_uploads_limit := 999999;
    ELSE v_uploads_limit := 0;
  END CASE;
  
  -- Count non-deleted uploads
  SELECT COUNT(*) INTO v_current_uploads
  FROM public.pack_uploads
  WHERE user_id = p_user_id AND deleted_at IS NULL;
  
  RETURN GREATEST(0, v_uploads_limit - v_current_uploads);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user can download
CREATE OR REPLACE FUNCTION public.can_download_free_pack(p_user_id uuid, p_pack_id uuid)
RETURNS json AS $$
DECLARE
  v_plan text;
  v_downloads_limit integer;
  v_current_downloads integer;
  v_result json;
BEGIN
  -- Get user's plan
  SELECT plan INTO v_plan FROM public.profiles WHERE id = p_user_id;
  
  -- If plan is not free, allow
  IF v_plan != 'free' THEN
    RETURN json_build_object(
      'can_download', true,
      'reason', 'non_free_plan'
    );
  END IF;
  
  -- For free plan, check limit
  SELECT COUNT(*) INTO v_current_downloads
  FROM public.pack_downloads
  WHERE user_id = p_user_id
    AND created_at >= DATE_TRUNC('month', NOW());
  
  v_downloads_limit := 10;
  
  IF v_current_downloads >= v_downloads_limit THEN
    RETURN json_build_object(
      'can_download', false,
      'reason', 'download_limit_exceeded',
      'current_downloads', v_current_downloads,
      'limit', v_downloads_limit,
      'message', 'Alcanzaste el límite de descargas para este mes'
    );
  END IF;
  
  RETURN json_build_object(
    'can_download', true,
    'reason', 'download_allowed',
    'current_downloads', v_current_downloads,
    'limit', v_downloads_limit
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on all functions
GRANT EXECUTE ON FUNCTION public.get_remaining_downloads TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_remaining_uploads TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_download_free_pack TO authenticated, anon;
