-- Update get_remaining_uploads to properly handle archived packs
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
  
  -- Count packs uploaded this month, excluding deleted and archived packs
  SELECT COUNT(*) INTO v_uploaded_month
  FROM packs
  WHERE user_id = p_user_id
    AND created_at >= DATE_TRUNC('month', NOW())
    AND COALESCE(is_deleted, false) = false
    AND COALESCE(archived, false) = false;
  
  v_uploaded_month := COALESCE(v_uploaded_month, 0);
  
  -- Count total active packs (not deleted, not archived)
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
      'total_packs', LEAST(v_total_packs, v_limit), -- Cap display at limit
      'limit', v_limit,
      'remaining', GREATEST(0, v_limit - v_total_packs)
    );
  ELSIF v_plan = 'de_0_a_hit' OR v_plan = 'de-0-a-hit' THEN
    -- De 0 a Hit: 10 packs per month
    v_limit := 10;
    RETURN jsonb_build_object(
      'uploaded_this_month', LEAST(v_uploaded_month, v_limit), -- Cap display at limit
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

-- Update get_download_limit to cap displayed values
CREATE OR REPLACE FUNCTION get_download_limit(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_plan TEXT;
  v_downloads INTEGER;
  v_limit INTEGER;
BEGIN
  -- Get user's plan
  SELECT plan INTO v_plan FROM profiles WHERE id = p_user_id;
  v_plan := COALESCE(v_plan, 'free');
  
  -- Count downloads this month
  SELECT COUNT(*) INTO v_downloads
  FROM pack_downloads
  WHERE user_id = p_user_id
    AND downloaded_at >= DATE_TRUNC('month', NOW());
  
  v_downloads := COALESCE(v_downloads, 0);
  
  -- Determine limit based on plan
  IF v_plan = 'free' THEN
    v_limit := 10;
    -- Cap displayed downloads at limit for better UX
    RETURN jsonb_build_object(
      'used', LEAST(v_downloads, v_limit),
      'limit', v_limit,
      'remaining', GREATEST(0, v_limit - v_downloads)
    );
  ELSIF v_plan = 'de_0_a_hit' OR v_plan = 'de-0-a-hit' OR v_plan = 'studio_plus' OR v_plan = 'studio-plus' THEN
    -- Paid plans: unlimited downloads
    RETURN jsonb_build_object(
      'used', v_downloads,
      'limit', 'unlimited',
      'remaining', 999999
    );
  ELSE
    -- Default to free plan limits
    v_limit := 10;
    RETURN jsonb_build_object(
      'used', LEAST(v_downloads, v_limit),
      'limit', v_limit,
      'remaining', GREATEST(0, v_limit - v_downloads)
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_remaining_uploads(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_download_limit(UUID) TO authenticated;

COMMENT ON FUNCTION get_remaining_uploads IS 'Returns upload usage and limits (capped at limit for display). Free: 3 total packs. de_0_a_hit: 10 per month. studio_plus: unlimited.';
COMMENT ON FUNCTION get_download_limit IS 'Returns download usage and limits (capped at limit for display). Free: 10 per month. Paid plans: unlimited.';
