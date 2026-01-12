-- Add missing plan column to profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'plan'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN plan TEXT DEFAULT 'free' 
      CHECK (plan IN ('free', 'de_0_a_hit', 'studio_plus'));
    
    CREATE INDEX idx_profiles_plan ON public.profiles(plan);
    
    -- Set all existing users to free plan
    UPDATE public.profiles SET plan = 'free' WHERE plan IS NULL;
  END IF;
END $$;

-- Create or replace RPC function for incrementing counters
CREATE OR REPLACE FUNCTION public.increment(
  table_name TEXT,
  row_id UUID,
  column_name TEXT
) RETURNS VOID AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I SET %I = COALESCE(%I, 0) + 1 WHERE id = $1',
    table_name, column_name, column_name
  ) USING row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix get_download_limit to return JSONB (not TABLE)
CREATE OR REPLACE FUNCTION get_download_limit(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_plan TEXT;
  v_downloads INTEGER;
BEGIN
  -- Get user's plan
  SELECT plan INTO v_plan FROM profiles WHERE id = p_user_id;
  v_plan := COALESCE(v_plan, 'free');
  
  -- Count downloads this month (calendar month)
  SELECT COUNT(*) INTO v_downloads
  FROM pack_downloads
  WHERE user_id = p_user_id
    AND downloaded_at >= DATE_TRUNC('month', NOW());
  
  v_downloads := COALESCE(v_downloads, 0);
  
  -- Return based on plan
  IF v_plan = 'free' THEN
    RETURN jsonb_build_object(
      'used', v_downloads,
      'limit', 10,
      'remaining', GREATEST(0, 10 - v_downloads)
    );
  ELSE
    -- Paid plans have unlimited downloads
    RETURN jsonb_build_object(
      'used', v_downloads,
      'limit', 'unlimited',
      'remaining', 999999
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix get_remaining_uploads to return JSONB (not TABLE)
CREATE OR REPLACE FUNCTION get_remaining_uploads(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_plan TEXT;
  v_uploaded_month INTEGER;
  v_total_packs INTEGER;
  v_limit INTEGER;
BEGIN
  -- Get user's plan
  SELECT plan INTO v_plan FROM profiles WHERE id = p_user_id;
  v_plan := COALESCE(v_plan, 'free');
  
  -- Count packs uploaded this month
  SELECT COUNT(*) INTO v_uploaded_month
  FROM packs
  WHERE user_id = p_user_id
    AND created_at >= DATE_TRUNC('month', NOW())
    AND is_deleted = false;
  
  v_uploaded_month := COALESCE(v_uploaded_month, 0);
  
  -- Count total packs
  SELECT COUNT(*) INTO v_total_packs
  FROM packs
  WHERE user_id = p_user_id
    AND is_deleted = false;
  
  v_total_packs := COALESCE(v_total_packs, 0);
  
  -- Determine limit and return based on plan
  IF v_plan = 'free' THEN
    -- Free: 3 packs TOTAL (not per month)
    v_limit := 3;
    RETURN jsonb_build_object(
      'uploaded_this_month', v_uploaded_month,
      'total_packs', v_total_packs,
      'limit', v_limit,
      'remaining', GREATEST(0, v_limit - v_total_packs)
    );
  ELSIF v_plan = 'de_0_a_hit' THEN
    -- De 0 a Hit: 10 packs per month
    v_limit := 10;
    RETURN jsonb_build_object(
      'uploaded_this_month', v_uploaded_month,
      'total_packs', v_total_packs,
      'limit', v_limit,
      'remaining', GREATEST(0, v_limit - v_uploaded_month)
    );
  ELSE
    -- Studio Plus: unlimited
    RETURN jsonb_build_object(
      'uploaded_this_month', v_uploaded_month,
      'total_packs', v_total_packs,
      'limit', 'unlimited',
      'remaining', 999999
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure pack_downloads has proper RLS policies
ALTER TABLE public.pack_downloads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own downloads" ON public.pack_downloads;
CREATE POLICY "Users can view their own downloads"
  ON public.pack_downloads FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own downloads" ON public.pack_downloads;
CREATE POLICY "Users can insert their own downloads"
  ON public.pack_downloads FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_download_limit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_remaining_uploads(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment(TEXT, UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION get_download_limit IS 'Returns download usage and limits for a user based on their plan';
COMMENT ON FUNCTION get_remaining_uploads IS 'Returns upload usage and limits for a user based on their plan';
COMMENT ON FUNCTION increment IS 'Safely increments a numeric column in any table';
