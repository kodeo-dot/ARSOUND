-- Update get_user_plan function to return a proper object with plan_type
-- Drop and recreate the function to return JSONB instead of TEXT
DROP FUNCTION IF EXISTS get_user_plan(UUID);

CREATE OR REPLACE FUNCTION get_user_plan(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_plan_type TEXT;
BEGIN
  SELECT plan_type INTO v_plan_type
  FROM user_plans
  WHERE user_id = p_user_id
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Default to 'free' if no plan found
  v_plan_type := COALESCE(v_plan_type, 'free');
  
  -- Return as JSON object
  RETURN jsonb_build_object('plan_type', v_plan_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
