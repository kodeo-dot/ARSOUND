-- Create trigger to sync user_plans with profiles.plan
-- This ensures both tables always stay in sync

CREATE OR REPLACE FUNCTION sync_plan_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profiles.plan when user_plans changes
  UPDATE profiles 
  SET plan = NEW.plan_type,
      updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_user_plans_to_profiles ON user_plans;

-- Create trigger that fires after insert or update on user_plans
CREATE TRIGGER sync_user_plans_to_profiles
  AFTER INSERT OR UPDATE ON user_plans
  FOR EACH ROW
  EXECUTE FUNCTION sync_plan_to_profile();

-- Sync existing data from user_plans to profiles
UPDATE profiles p
SET plan = COALESCE(
  (SELECT up.plan_type 
   FROM user_plans up 
   WHERE up.user_id = p.id 
   AND up.is_active = true 
   ORDER BY up.created_at DESC 
   LIMIT 1),
  'free'
);

COMMENT ON FUNCTION sync_plan_to_profile IS 'Automatically syncs user_plans.plan_type to profiles.plan';
