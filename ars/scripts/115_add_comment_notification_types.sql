-- Update notifications constraint to include comment and reply types
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN ('follow', 'like', 'purchase', 'limit_reached', 'download', 'profile_view', 'comment', 'reply'));
