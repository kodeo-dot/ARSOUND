-- Add new notification types: limit_reached, download, profile_view
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('follow', 'like', 'purchase', 'limit_reached', 'download', 'profile_view'));

-- Add metadata field for additional notification data (like remaining downloads, reset date, etc.)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create profile_views table to track unique profile views
CREATE TABLE IF NOT EXISTS profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(profile_id, viewer_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_id ON profile_views(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer_id ON profile_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at ON profile_views(viewed_at DESC);

-- Enable RLS
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile views
CREATE POLICY "Users can view their own profile views"
  ON profile_views FOR SELECT
  USING (auth.uid() = profile_id OR auth.uid() = viewer_id);

-- Policy: Anyone can insert profile views
CREATE POLICY "Anyone can insert profile views"
  ON profile_views FOR INSERT
  WITH CHECK (auth.uid() = viewer_id);

-- Update create_notification function to support metadata
DROP FUNCTION IF EXISTS create_notification(UUID, TEXT, UUID, UUID);

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_actor_id UUID DEFAULT NULL,
  p_pack_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  -- Don't create notification if actor is the same as user (except for limit_reached)
  IF p_user_id = p_actor_id AND p_type != 'limit_reached' THEN
    RETURN NULL;
  END IF;

  INSERT INTO notifications (user_id, type, actor_id, pack_id, metadata)
  VALUES (p_user_id, p_type, p_actor_id, p_pack_id, p_metadata)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create notification when someone downloads a pack
CREATE OR REPLACE FUNCTION notify_on_download()
RETURNS TRIGGER AS $$
DECLARE
  pack_owner_id UUID;
BEGIN
  -- Get pack owner
  SELECT user_id INTO pack_owner_id
  FROM packs
  WHERE id = NEW.pack_id;
  
  -- Only notify if downloader is not the owner
  IF pack_owner_id != NEW.user_id THEN
    PERFORM create_notification(
      pack_owner_id,
      'download',
      NEW.user_id,
      NEW.pack_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_on_download ON pack_downloads;
CREATE TRIGGER trigger_notify_on_download
  AFTER INSERT ON pack_downloads
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_download();

-- Function to record profile view and create notification (only first time)
CREATE OR REPLACE FUNCTION record_profile_view(
  p_profile_id UUID,
  p_viewer_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  is_new_view BOOLEAN;
BEGIN
  -- Don't record if viewer is the profile owner
  IF p_profile_id = p_viewer_id THEN
    RETURN FALSE;
  END IF;

  -- Try to insert the view (will fail if already exists)
  INSERT INTO profile_views (profile_id, viewer_id)
  VALUES (p_profile_id, p_viewer_id)
  ON CONFLICT (profile_id, viewer_id) DO NOTHING
  RETURNING TRUE INTO is_new_view;
  
  -- If it's a new view, create notification
  IF is_new_view THEN
    PERFORM create_notification(
      p_profile_id,
      'profile_view',
      p_viewer_id
    );
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION record_profile_view(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification(UUID, TEXT, UUID, UUID, JSONB) TO authenticated;
