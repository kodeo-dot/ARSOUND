-- Create the can_download_pack RPC function
CREATE OR REPLACE FUNCTION public.can_download_pack(
  p_user_id uuid,
  p_pack_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_pack_price integer;
  v_downloads_this_month integer;
  v_download_limit integer;
  v_plan_type text;
BEGIN
  -- Get pack price
  SELECT price INTO v_pack_price
  FROM packs
  WHERE id = p_pack_id;

  -- Get user's current plan
  SELECT plan_type INTO v_plan_type
  FROM user_plans
  WHERE user_id = p_user_id
    AND is_active = true
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  -- Default to free plan if no active plan
  IF v_plan_type IS NULL THEN
    v_plan_type := 'free';
  END IF;

  -- Count downloads this month
  SELECT COUNT(*) INTO v_downloads_this_month
  FROM pack_downloads
  WHERE user_id = p_user_id
    AND DATE_TRUNC('month', downloaded_at) = DATE_TRUNC('month', NOW());

  -- Set download limit based on plan
  IF v_plan_type = 'free' THEN
    v_download_limit := 10;
  ELSIF v_plan_type = 'de-0-a-hit' THEN
    v_download_limit := 100;
  ELSE -- studio-plus or any other plan
    v_download_limit := 999999; -- Effectively unlimited
  END IF;

  -- Check if user can download
  IF v_downloads_this_month >= v_download_limit THEN
    RETURN jsonb_build_object(
      'can_download', false,
      'reason', 'download_limit_exceeded',
      'message', 'Ya alcanzaste tu límite de descargas este mes',
      'downloads_this_month', v_downloads_this_month,
      'download_limit', v_download_limit,
      'plan_type', v_plan_type
    );
  END IF;

  -- Success
  RETURN jsonb_build_object(
    'can_download', true,
    'reason', 'allowed',
    'message', 'Puedes descargar este pack',
    'downloads_this_month', v_downloads_this_month,
    'download_limit', v_download_limit,
    'plan_type', v_plan_type
  );
END;
$$ LANGUAGE plpgsql;
