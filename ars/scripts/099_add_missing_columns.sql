-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free' CHECK (plan IN ('free', 'de-0-a-hit', 'studio-plus')),
ADD COLUMN IF NOT EXISTS downloads_this_month integer DEFAULT 0;

-- Add missing columns to packs table
ALTER TABLE public.packs 
ADD COLUMN IF NOT EXISTS discount_percent integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_discount boolean DEFAULT false;

-- Ensure all existing records have valid defaults
UPDATE public.profiles SET plan = 'free' WHERE plan IS NULL;
UPDATE public.profiles SET downloads_this_month = 0 WHERE downloads_this_month IS NULL;
UPDATE public.packs SET discount_percent = 0 WHERE discount_percent IS NULL;
UPDATE public.packs SET has_discount = false WHERE has_discount IS NULL;

-- Create indices
CREATE INDEX IF NOT EXISTS profiles_plan_idx ON public.profiles(plan);
CREATE INDEX IF NOT EXISTS packs_discount_idx ON public.packs(has_discount, discount_percent);
CREATE INDEX IF NOT EXISTS pack_downloads_user_date_idx ON public.pack_downloads(user_id, created_at);

-- Create or replace the RPC functions for getting remaining downloads
CREATE OR REPLACE FUNCTION get_remaining_downloads(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  user_plan text;
  download_limit integer;
  current_month_downloads integer;
BEGIN
  -- Get user's plan
  SELECT plan INTO user_plan FROM public.profiles WHERE id = p_user_id;
  
  -- If no plan found, default to free
  user_plan := COALESCE(user_plan, 'free');
  
  -- Determine download limit based on plan
  download_limit := CASE user_plan
    WHEN 'free' THEN 10
    WHEN 'de-0-a-hit' THEN 100
    WHEN 'studio-plus' THEN 999999
    ELSE 10
  END;
  
  -- Count downloads this month
  SELECT COUNT(*) INTO current_month_downloads
  FROM public.pack_downloads
  WHERE user_id = p_user_id
    AND created_at >= NOW() - INTERVAL '30 days';
  
  -- Return remaining downloads
  RETURN GREATEST(0, download_limit - current_month_downloads);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the RPC function for checking if user can download
CREATE OR REPLACE FUNCTION can_download_free_pack(p_user_id uuid, p_pack_id uuid)
RETURNS TABLE (
  can_download boolean,
  message text,
  reason text,
  current_downloads integer,
  limit integer
) AS $$
DECLARE
  user_plan text;
  download_limit integer;
  current_month_downloads integer;
  pack_price integer;
BEGIN
  -- Get user's plan and pack price
  SELECT plan INTO user_plan FROM public.profiles WHERE id = p_user_id;
  SELECT price INTO pack_price FROM public.packs WHERE id = p_pack_id;
  
  user_plan := COALESCE(user_plan, 'free');
  
  -- If pack is not free, allow download (payment validation happens elsewhere)
  IF COALESCE(pack_price, 0) > 0 THEN
    RETURN QUERY SELECT true, 'Pack disponible para compra'::text, 'paid'::text, 0::integer, 0::integer;
    RETURN;
  END IF;
  
  -- Determine download limit based on plan
  download_limit := CASE user_plan
    WHEN 'free' THEN 10
    WHEN 'de-0-a-hit' THEN 100
    WHEN 'studio-plus' THEN 999999
    ELSE 10
  END;
  
  -- Count downloads this month
  SELECT COUNT(*) INTO current_month_downloads
  FROM public.pack_downloads
  WHERE user_id = p_user_id
    AND created_at >= NOW() - INTERVAL '30 days';
  
  -- Check if user can download
  IF current_month_downloads >= download_limit THEN
    RETURN QUERY SELECT 
      false,
      'Alcanzaste el límite de descargas para este mes',
      'limit_exceeded',
      current_month_downloads,
      download_limit;
  ELSE
    RETURN QUERY SELECT 
      true,
      'Puedes descargar este pack',
      'allowed',
      current_month_downloads,
      download_limit;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the get_remaining_uploads function
CREATE OR REPLACE FUNCTION get_remaining_uploads(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  user_plan text;
  upload_limit integer;
  current_uploads integer;
BEGIN
  -- Get user's plan
  SELECT plan INTO user_plan FROM public.profiles WHERE id = p_user_id;
  
  user_plan := COALESCE(user_plan, 'free');
  
  -- Determine upload limit based on plan
  upload_limit := CASE user_plan
    WHEN 'free' THEN 3
    WHEN 'de-0-a-hit' THEN 10
    WHEN 'studio-plus' THEN 999999
    ELSE 3
  END;
  
  -- Count active packs (not deleted)
  SELECT COUNT(*) INTO current_uploads
  FROM public.packs
  WHERE user_id = p_user_id
    AND deleted_at IS NULL;
  
  -- Return remaining uploads
  RETURN GREATEST(0, upload_limit - current_uploads);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
