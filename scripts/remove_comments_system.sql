-- Script to remove the comments system from the database
-- Run this script in your Supabase SQL editor

-- Drop comment-related notifications
DELETE FROM notifications WHERE type IN ('comment', 'comment_reply', 'comment_mention');

-- Drop the pack_comments table
DROP TABLE IF EXISTS pack_comments CASCADE;

-- Remove comment notification types from the enum (optional - may cause issues with existing data)
-- ALTER TYPE notification_type DROP VALUE IF EXISTS 'comment';
-- ALTER TYPE notification_type DROP VALUE IF EXISTS 'comment_reply';
-- ALTER TYPE notification_type DROP VALUE IF EXISTS 'comment_mention';

-- Note: Dropping enum values is complex in PostgreSQL and may require recreating the enum
-- If you want to remove the enum values completely, you'll need to:
-- 1. Create a new enum without those values
-- 2. Alter the notifications table to use the new enum
-- 3. Drop the old enum

COMMENT ON SCHEMA public IS 'Comments system removed - script executed';
