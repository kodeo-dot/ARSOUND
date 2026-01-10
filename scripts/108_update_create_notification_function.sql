-- Update create_notification function to accept metadata
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_actor_id UUID,
  p_pack_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  -- Don't create notification if actor is the same as user
  IF p_user_id = p_actor_id THEN
    RETURN NULL;
  END IF;

  INSERT INTO notifications (user_id, type, actor_id, pack_id, metadata)
  VALUES (p_user_id, p_type, p_actor_id, p_pack_id, p_metadata)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also add metadata column if it doesn't exist
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS metadata JSONB;
