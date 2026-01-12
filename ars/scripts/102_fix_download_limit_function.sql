-- Fix the get_download_limit function to return correct structure
CREATE OR REPLACE FUNCTION public.get_download_limit(p_user_id uuid)
RETURNS json AS $$
DECLARE
  v_plan text;
  v_downloads_limit integer;
  v_current_downloads integer;
  v_remaining integer;
BEGIN
  -- Get user's plan
  SELECT plan INTO v_plan FROM public.profiles WHERE id = p_user_id;
  
  -- Determine limit based on plan
  CASE v_plan
    WHEN 'free' THEN v_downloads_limit := 10;
    WHEN 'de_0_a_hit' THEN v_downloads_limit := 30;
    WHEN 'studio_plus' THEN 
      -- Return unlimited for studio plus
      RETURN json_build_object(
        'limit', 'unlimited',
        'used', 0,
        'remaining', 'unlimited'
      );
    ELSE v_downloads_limit := 10;
  END CASE;
  
  -- Count downloads this month
  SELECT COUNT(*) INTO v_current_downloads 
  FROM public.pack_downloads 
  WHERE user_id = p_user_id 
    AND downloaded_at >= DATE_TRUNC('month', NOW());
  
  v_remaining := GREATEST(0, v_downloads_limit - v_current_downloads);
  
  RETURN json_build_object(
    'limit', v_downloads_limit,
    'used', v_current_downloads,
    'remaining', v_remaining
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the can_download_free_pack function to properly check limits
CREATE OR REPLACE FUNCTION public.can_download_free_pack(p_user_id uuid, p_pack_id uuid)
RETURNS json AS $$
DECLARE
  v_plan text;
  v_downloads_limit integer;
  v_current_downloads integer;
BEGIN
  -- Get user's plan
  SELECT plan INTO v_plan FROM public.profiles WHERE id = p_user_id;
  
  -- Studio Plus has unlimited downloads
  IF v_plan = 'studio_plus' THEN
    RETURN json_build_object(
      'can_download', true,
      'reason', 'unlimited_plan',
      'current_downloads', 0,
      'limit', 'unlimited'
    );
  END IF;
  
  -- Determine limit based on plan
  CASE v_plan
    WHEN 'free' THEN v_downloads_limit := 10;
    WHEN 'de_0_a_hit' THEN v_downloads_limit := 30;
    ELSE v_downloads_limit := 10;
  END CASE;
  
  -- Count downloads this month
  SELECT COUNT(*) INTO v_current_downloads
  FROM public.pack_downloads
  WHERE user_id = p_user_id
    AND downloaded_at >= DATE_TRUNC('month', NOW());
  
  -- Check if limit exceeded
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

-- Add limit_reached notification type to notifications table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'notification_type_enum'
  ) THEN
    -- Type doesn't exist, notification types might be a plain text field
    -- No action needed
  END IF;
END $$;
