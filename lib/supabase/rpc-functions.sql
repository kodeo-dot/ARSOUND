-- RPC function to count packs uploaded this month
CREATE OR REPLACE FUNCTION public.get_packs_this_month(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  month_start timestamp;
  pack_count integer;
BEGIN
  month_start := DATE_TRUNC('month', NOW());
  SELECT COUNT(*) INTO pack_count 
  FROM public.packs
  WHERE user_id = p_user_id 
    AND created_at >= month_start 
    AND is_deleted = false;
  RETURN pack_count;
END;
$$ LANGUAGE plpgsql;

-- RPC function to get remaining uploads for current month
CREATE OR REPLACE FUNCTION public.get_remaining_uploads(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  plan_type text;
  packs_this_month integer;
  month_limit integer;
BEGIN
  -- Get user's current plan
  SELECT plan INTO plan_type FROM public.profiles WHERE id = p_user_id;
  
  IF plan_type IS NULL THEN
    RETURN jsonb_build_object('error', 'User plan not found');
  END IF;

  -- Determine month limit based on plan
  CASE plan_type
    WHEN 'free' THEN month_limit := 3;
    WHEN 'de_0_a_hit' THEN month_limit := 10;
    WHEN 'de-0-a-hit' THEN month_limit := 10;
    WHEN 'studio_plus' THEN month_limit := NULL; -- unlimited
    WHEN 'studio-plus' THEN month_limit := NULL;
    ELSE month_limit := 3;
  END CASE;

  -- Count packs this month
  packs_this_month := get_packs_this_month(p_user_id);

  IF month_limit IS NULL THEN
    RETURN jsonb_build_object(
      'plan', plan_type,
      'remaining', -1,
      'limit', 'unlimited',
      'uploaded_this_month', packs_this_month
    );
  END IF;

  RETURN jsonb_build_object(
    'plan', plan_type,
    'remaining', GREATEST(0, month_limit - packs_this_month),
    'limit', month_limit,
    'uploaded_this_month', packs_this_month
  );
END;
$$ LANGUAGE plpgsql;

-- RPC function to verify and track downloads
CREATE OR REPLACE FUNCTION public.can_download_pack(p_user_id uuid, p_pack_id uuid)
RETURNS jsonb AS $$
DECLARE
  pack_price integer;
  user_plan text;
  download_count integer;
  month_start timestamp;
  has_purchased boolean;
  download_limit integer;
BEGIN
  -- Get pack price
  SELECT price INTO pack_price FROM public.packs WHERE id = p_pack_id;
  
  IF pack_price IS NULL THEN
    RETURN jsonb_build_object('can_download', false, 'reason', 'Pack not found');
  END IF;

  -- If pack is paid, check if user purchased it
  IF pack_price > 0 THEN
    SELECT EXISTS(
      SELECT 1 FROM public.purchases 
      WHERE buyer_id = p_user_id AND pack_id = p_pack_id AND status = 'completed'
    ) INTO has_purchased;
    
    IF has_purchased THEN
      RETURN jsonb_build_object('can_download', true, 'reason', 'Pack purchased');
    ELSE
      RETURN jsonb_build_object('can_download', false, 'reason', 'Pack not purchased');
    END IF;
  END IF;

  -- For free packs, check download limit based on user plan
  SELECT plan INTO user_plan FROM public.profiles WHERE id = p_user_id;
  
  IF user_plan IS NULL THEN
    user_plan := 'free';
  END IF;

  -- Determine download limit
  CASE user_plan
    WHEN 'free' THEN download_limit := 10;
    WHEN 'de_0_a_hit' THEN download_limit := 100;
    WHEN 'de-0-a-hit' THEN download_limit := 100;
    WHEN 'studio_plus' THEN download_limit := NULL; -- unlimited
    WHEN 'studio-plus' THEN download_limit := NULL;
    ELSE download_limit := 10;
  END CASE;

  -- If unlimited, allow download
  IF download_limit IS NULL THEN
    RETURN jsonb_build_object('can_download', true, 'reason', 'Unlimited plan');
  END IF;

  -- Count free pack downloads this month
  month_start := DATE_TRUNC('month', NOW());
  SELECT COUNT(*) INTO download_count 
  FROM public.pack_downloads
  WHERE user_id = p_user_id AND downloaded_at >= month_start;

  IF download_count < download_limit THEN
    RETURN jsonb_build_object(
      'can_download', true,
      'downloads_this_month', download_count,
      'download_limit', download_limit
    );
  ELSE
    RETURN jsonb_build_object(
      'can_download', false,
      'reason', 'Download limit reached',
      'downloads_this_month', download_count,
      'download_limit', download_limit
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Helper function to increment counters
CREATE OR REPLACE FUNCTION public.increment_counter(
  table_name text,
  row_id uuid,
  column_name text
)
RETURNS void AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I SET %I = %I + 1 WHERE id = %L',
    table_name, column_name, column_name, row_id
  );
END;
$$ LANGUAGE plpgsql;
