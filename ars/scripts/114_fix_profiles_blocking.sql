-- Script to ensure profiles table has blocking columns and sync from admin_actions
-- This fixes the issue where users blocked via admin_actions don't have is_blocked set in profiles

-- 1. Ensure profiles has the necessary blocking columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE;

-- 2. Create an index for faster blocked user checks
CREATE INDEX IF NOT EXISTS idx_profiles_is_blocked ON profiles(is_blocked) WHERE is_blocked = true;

-- 3. Sync blocking status from admin_actions to profiles
-- This will update profiles where a block action exists but is_blocked is false
WITH latest_blocks AS (
  SELECT DISTINCT ON (target_id)
    target_id,
    action_type,
    details,
    created_at
  FROM admin_actions
  WHERE target_type = 'user'
    AND (action_type = 'block_user' OR action_type = 'unblock_user')
  ORDER BY target_id, created_at DESC
)
UPDATE profiles
SET 
  is_blocked = (lb.action_type = 'block_user'),
  blocked_reason = CASE 
    WHEN lb.action_type = 'block_user' THEN COALESCE(lb.details->>'reason', 'Blocked by administrator')
    ELSE NULL
  END,
  blocked_at = CASE 
    WHEN lb.action_type = 'block_user' THEN lb.created_at
    ELSE NULL
  END
FROM latest_blocks lb
WHERE profiles.id = lb.target_id::uuid
  AND (
    (lb.action_type = 'block_user' AND profiles.is_blocked = false)
    OR (lb.action_type = 'unblock_user' AND profiles.is_blocked = true)
  );

-- 4. Create a trigger to automatically update profiles when admin blocks/unblocks users
CREATE OR REPLACE FUNCTION sync_profile_block_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.target_type = 'user' AND NEW.action_type = 'block_user' THEN
    UPDATE profiles
    SET 
      is_blocked = true,
      blocked_reason = COALESCE(NEW.details->>'reason', 'Blocked by administrator'),
      blocked_at = NEW.created_at
    WHERE id = NEW.target_id::uuid;
  ELSIF NEW.target_type = 'user' AND NEW.action_type = 'unblock_user' THEN
    UPDATE profiles
    SET 
      is_blocked = false,
      blocked_reason = NULL,
      blocked_at = NULL
    WHERE id = NEW.target_id::uuid;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_profile_block_trigger ON admin_actions;
CREATE TRIGGER sync_profile_block_trigger
  AFTER INSERT ON admin_actions
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_block_status();

-- 5. Add comment for documentation
COMMENT ON TRIGGER sync_profile_block_trigger ON admin_actions IS 
  'Automatically syncs blocking status from admin_actions to profiles table';
