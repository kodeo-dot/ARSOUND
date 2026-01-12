-- Fix discount_codes constraint to support up to 100% discount for Studio Plus users
ALTER TABLE public.discount_codes DROP CONSTRAINT IF EXISTS discount_codes_discount_percent_check;
ALTER TABLE public.discount_codes ADD CONSTRAINT discount_codes_discount_percent_check 
  CHECK (discount_percent > 0 AND discount_percent <= 100);

-- Add Mercado Pago connection fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mp_access_token TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mp_user_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mp_connected BOOLEAN DEFAULT false;

-- Create index for Mercado Pago connected users
CREATE INDEX IF NOT EXISTS idx_profiles_mp_connected ON public.profiles(mp_connected);

-- Update count_packs_this_month function to return correct count
CREATE OR REPLACE FUNCTION count_packs_this_month(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM packs
  WHERE user_id = p_user_id
    AND created_at >= DATE_TRUNC('month', NOW())
    AND is_deleted = false;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check total packs for a user
CREATE OR REPLACE FUNCTION count_total_packs(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM packs
  WHERE user_id = p_user_id
    AND is_deleted = false;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get remaining uploads for a user based on plan
CREATE OR REPLACE FUNCTION get_remaining_uploads(p_user_id UUID)
RETURNS TABLE(
  uploaded_this_month INTEGER,
  total_packs INTEGER,
  limit INTEGER,
  remaining INTEGER
) AS $$
DECLARE
  v_plan TEXT;
  v_uploaded INTEGER;
  v_total INTEGER;
  v_limit INTEGER;
BEGIN
  -- Get user's plan
  SELECT plan INTO v_plan FROM profiles WHERE id = p_user_id;
  v_plan := COALESCE(v_plan, 'free');
  
  -- Get uploaded packs this month
  v_uploaded := count_packs_this_month(p_user_id);
  
  -- Get total packs
  v_total := count_total_packs(p_user_id);
  
  -- Determine limit based on plan
  IF v_plan = 'free' THEN
    -- Free plan: 3 packs TOTAL (not per month)
    v_limit := 3;
    RETURN QUERY SELECT v_uploaded, v_total, v_limit, GREATEST(0, v_limit - v_total);
  ELSIF v_plan = 'de_0_a_hit' THEN
    -- De 0 a Hit: 10 packs per month
    v_limit := 10;
    RETURN QUERY SELECT v_uploaded, v_total, v_limit, GREATEST(0, v_limit - v_uploaded);
  ELSE
    -- Studio Plus: unlimited
    RETURN QUERY SELECT v_uploaded, v_total, -1, 999999;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get download limit for a user
CREATE OR REPLACE FUNCTION get_download_limit(p_user_id UUID)
RETURNS TABLE(
  used INTEGER,
  limit TEXT,
  remaining INTEGER
) AS $$
DECLARE
  v_plan TEXT;
  v_downloads INTEGER;
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
  
  -- Return based on plan
  IF v_plan = 'free' THEN
    RETURN QUERY SELECT v_downloads, '10'::TEXT, GREATEST(0, 10 - v_downloads);
  ELSE
    -- Paid plans have unlimited downloads
    RETURN QUERY SELECT v_downloads, 'unlimited'::TEXT, 999999;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON COLUMN profiles.mp_access_token IS 'Mercado Pago OAuth access token for split payments';
COMMENT ON COLUMN profiles.mp_user_id IS 'Mercado Pago user ID from OAuth';
COMMENT ON COLUMN profiles.mp_connected IS 'Whether user has connected their Mercado Pago account';
