-- Update notifications table to support limit_reached type
ALTER TABLE notifications 
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications 
  ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('follow', 'like', 'purchase', 'limit_reached'));

-- Add optional fields for limit notifications
ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Policy: Allow system to insert limit notifications
CREATE POLICY "System can create limit notifications"
  ON notifications FOR INSERT
  WITH CHECK (type = 'limit_reached');
