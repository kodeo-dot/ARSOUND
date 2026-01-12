CREATE OR REPLACE FUNCTION public.can_download_free_pack(p_user_id uuid, p_pack_id uuid)
RETURNS boolean AS $$
DECLARE
  pack_price integer;
  user_plan text;
  download_count integer;
  month_start timestamp;
BEGIN
  SELECT price INTO pack_price FROM public.packs WHERE id = p_pack_id;
  
  IF pack_price IS NULL THEN
    RETURN false;
  END IF;
  
  IF pack_price > 0 THEN
    SELECT COUNT(*) INTO download_count FROM public.purchases 
    WHERE buyer_id = p_user_id AND pack_id = p_pack_id AND status = 'completed';
    RETURN download_count > 0;
  END IF;
  
  SELECT plan INTO user_plan FROM public.profiles WHERE id = p_user_id;
  
  IF user_plan = 'free' THEN
    month_start := DATE_TRUNC('month', NOW());
    SELECT COUNT(*) INTO download_count FROM public.pack_downloads 
    WHERE user_id = p_user_id AND downloaded_at >= month_start;
    RETURN download_count < 10;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.get_remaining_downloads(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  user_plan text;
  download_count integer;
  month_start timestamp;
  limit_count integer;
BEGIN
  SELECT plan INTO user_plan FROM public.profiles WHERE id = p_user_id;
  
  IF user_plan = 'free' THEN
    limit_count := 10;
  ELSIF user_plan = 'de-0-a-hit' THEN
    limit_count := 100;
  ELSE
    RETURN -1;
  END IF;
  
  month_start := DATE_TRUNC('month', NOW());
  SELECT COUNT(*) INTO download_count FROM public.pack_downloads 
  WHERE user_id = p_user_id AND downloaded_at >= month_start;
  
  RETURN GREATEST(0, limit_count - download_count);
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.get_remaining_uploads(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  user_plan text;
  pack_count integer;
  limit_count integer;
BEGIN
  SELECT plan INTO user_plan FROM public.profiles WHERE id = p_user_id;
  
  IF user_plan = 'free' THEN
    limit_count := 1;
  ELSIF user_plan = 'de-0-a-hit' THEN
    limit_count := 10;
  ELSE
    RETURN -1;
  END IF;
  
  SELECT COUNT(*) INTO pack_count FROM public.packs WHERE user_id = p_user_id;
  
  RETURN GREATEST(0, limit_count - pack_count);
END;
$$ LANGUAGE plpgsql STABLE;
