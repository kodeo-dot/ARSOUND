-- Function to create default 'free' plan for new users
CREATE OR REPLACE FUNCTION create_default_user_plan()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a 'free' plan for the new user
  INSERT INTO user_plans (user_id, plan_type, is_active, expires_at)
  VALUES (NEW.id, 'free', TRUE, NULL);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create free plan when profile is created
DROP TRIGGER IF EXISTS on_profile_created_create_plan ON profiles;

CREATE TRIGGER on_profile_created_create_plan
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_user_plan();

-- Backfill existing users without a plan (assign them 'free' plan)
INSERT INTO user_plans (user_id, plan_type, is_active, expires_at)
SELECT p.id, 'free', TRUE, NULL
FROM profiles p
LEFT JOIN user_plans up ON p.id = up.user_id
WHERE up.id IS NULL
ON CONFLICT DO NOTHING;
