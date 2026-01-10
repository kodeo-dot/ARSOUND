-- Fix download limit checking completely
-- This script ensures the download limit logic works correctly for new users

-- Drop existing function
DROP FUNCTION IF EXISTS public.can_download_free_pack(uuid, uuid);

-- Recreate with proper monthly reset logic
CREATE OR REPLACE FUNCTION public.can_download_free_pack(p_user_id uuid, p_pack_id uuid)
RETURNS json AS $$
DECLARE
  v_plan text;
  v_downloads_limit integer;
  v_current_downloads integer;
  v_pack_price numeric;
BEGIN
  -- Get pack price first
  SELECT price INTO v_pack_price FROM public.packs WHERE id = p_pack_id;
  
  -- If pack is not free (price > 0), check if user purchased it
  IF v_pack_price IS NOT NULL AND v_pack_price > 0 THEN
    IF EXISTS (
      SELECT 1 FROM public.purchases
      WHERE pack_id = p_pack_id 
        AND buyer_id = p_user_id 
        AND status = 'completed'
    ) THEN
      RETURN json_build_object(
        'can_download', true,
        'reason', 'purchased'
      );
    ELSE
      RETURN json_build_object(
        'can_download', false,
        'reason', 'not_purchased',
        'message', 'Necesitás comprar este pack para descargarlo'
      );
    END IF;
  END IF;
  
  -- For free packs, check user's plan
  SELECT plan INTO v_plan FROM public.profiles WHERE id = p_user_id;
  
  -- If no plan found, default to free
  IF v_plan IS NULL THEN
    v_plan := 'free';
  END IF;
  
  -- Studio Plus and De 0 a Hit have unlimited downloads
  IF v_plan IN ('de_0_a_hit', 'studio_plus') THEN
    RETURN json_build_object(
      'can_download', true,
      'reason', 'unlimited_plan'
    );
  END IF;
  
  -- For free plan, check download limit (10 per month)
  v_downloads_limit := 10;
  
  -- Count downloads THIS CALENDAR MONTH (not last 30 days)
  SELECT COUNT(*) INTO v_current_downloads 
  FROM public.pack_downloads 
  WHERE user_id = p_user_id 
    AND downloaded_at >= DATE_TRUNC('month', CURRENT_TIMESTAMP);
  
  -- Log for debugging
  RAISE NOTICE 'User: %, Plan: %, Downloads this month: %, Limit: %', 
    p_user_id, v_plan, v_current_downloads, v_downloads_limit;
  
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

-- Recreate the get_download_limit function
DROP FUNCTION IF EXISTS public.get_download_limit(uuid);

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
  
  -- If no plan, default to free
  IF v_plan IS NULL THEN
    v_plan := 'free';
  END IF;
  
  -- Determine limit based on plan
  CASE v_plan
    WHEN 'free' THEN v_downloads_limit := 10;
    WHEN 'de_0_a_hit' THEN 
      -- Return unlimited for de_0_a_hit
      RETURN json_build_object(
        'limit', 'unlimited',
        'used', 0,
        'remaining', 'unlimited'
      );
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
    AND downloaded_at >= DATE_TRUNC('month', CURRENT_TIMESTAMP);
  
  v_remaining := GREATEST(0, v_downloads_limit - v_current_downloads);
  
  RETURN json_build_object(
    'limit', v_downloads_limit,
    'used', v_current_downloads,
    'remaining', v_remaining
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
