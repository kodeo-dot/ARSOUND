-- Add plan column directly to profiles table for simplicity
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'de_0_a_hit', 'studio_plus'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);

-- Migrate existing data from user_plans to profiles.plan
UPDATE profiles p
SET plan = COALESCE(
  (SELECT up.plan_type 
   FROM user_plans up 
   WHERE up.user_id = p.id 
     AND up.is_active = TRUE 
     AND (up.expires_at IS NULL OR up.expires_at > NOW())
   ORDER BY up.created_at DESC 
   LIMIT 1),
  'free'
);

-- Update trigger to set default plan when profile is created
CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure plan is set to 'free' if not specified
  IF NEW.plan IS NULL THEN
    NEW.plan := 'free';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if exists and create new one
DROP TRIGGER IF EXISTS set_default_plan_on_profile ON profiles;
CREATE TRIGGER set_default_plan_on_profile
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_profile();

-- Function to count packs uploaded this month (keep this useful function)
CREATE OR REPLACE FUNCTION count_packs_this_month(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM packs
    WHERE user_id = p_user_id
      AND created_at >= DATE_TRUNC('month', NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: We keep user_plans table for historical data and future subscription management
-- but profiles.plan becomes the source of truth for current plan
COMMENT ON COLUMN profiles.plan IS 'Current active plan for the user (source of truth)';
COMMENT ON TABLE user_plans IS 'Historical plan data and subscription management (deprecated for current plan lookups)';
