-- Fix the get_remaining_uploads function to correctly count non-deleted packs
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
  
  -- Fix: Count packs uploaded this month, excluding deleted and archived packs
  SELECT COUNT(*) INTO v_uploaded_month
  FROM packs
  WHERE user_id = p_user_id
    AND created_at >= DATE_TRUNC('month', NOW())
    AND COALESCE(is_deleted, false) = false
    AND COALESCE(archived, false) = false;
  
  v_uploaded_month := COALESCE(v_uploaded_month, 0);
  
  -- Fix: Count total active packs (not deleted, not archived)
  SELECT COUNT(*) INTO v_total_packs
  FROM packs
  WHERE user_id = p_user_id
    AND COALESCE(is_deleted, false) = false
    AND COALESCE(archived, false) = false;
  
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_remaining_uploads(UUID) TO authenticated;

COMMENT ON FUNCTION get_remaining_uploads IS 'Returns upload usage and limits for a user. For free plan: 3 total packs. For de_0_a_hit: 10 per month. For studio_plus: unlimited.';

-- Ensure pack_likes table has proper columns and constraints
-- (This should already exist, but we verify it)
DO $$
BEGIN
  -- Check if pack_likes exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pack_likes') THEN
    -- Add any missing indexes for performance
    CREATE INDEX IF NOT EXISTS idx_pack_likes_user_pack ON pack_likes(user_id, pack_id);
    CREATE INDEX IF NOT EXISTS idx_pack_likes_pack ON pack_likes(pack_id);
    CREATE INDEX IF NOT EXISTS idx_pack_likes_created ON pack_likes(created_at DESC);
  END IF;
END $$;
