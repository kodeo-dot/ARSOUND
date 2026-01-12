-- Add RLS policies for pack_comments table
-- Run this in Supabase SQL Editor

-- Policy: Anyone can view comments
DROP POLICY IF EXISTS "Anyone can view comments" ON pack_comments;
CREATE POLICY "Anyone can view comments"
  ON pack_comments FOR SELECT
  USING (true);

-- Policy: Authenticated users can create comments
DROP POLICY IF EXISTS "Authenticated users can comment" ON pack_comments;
CREATE POLICY "Authenticated users can comment"
  ON pack_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own comments
DROP POLICY IF EXISTS "Users can update own comments" ON pack_comments;
CREATE POLICY "Users can update own comments"
  ON pack_comments FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own comments
DROP POLICY IF EXISTS "Users can delete own comments" ON pack_comments;
CREATE POLICY "Users can delete own comments"
  ON pack_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Create notification trigger for new comments
CREATE OR REPLACE FUNCTION notify_pack_owner_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_pack_owner_id UUID;
  v_pack_title TEXT;
  v_commenter_username TEXT;
BEGIN
  -- Using title instead of name for packs table
  -- Get pack owner
  SELECT user_id, title INTO v_pack_owner_id, v_pack_title
  FROM packs WHERE id = NEW.pack_id;
  
  -- Get commenter username
  SELECT username INTO v_commenter_username
  FROM profiles WHERE id = NEW.user_id;
  
  -- Don't notify if commenting on own pack
  IF v_pack_owner_id != NEW.user_id AND NEW.parent_id IS NULL THEN
    INSERT INTO notifications (user_id, type, actor_id, pack_id, metadata)
    VALUES (
      v_pack_owner_id,
      'comment',
      NEW.user_id,
      NEW.pack_id,
      jsonb_build_object(
        'comment_id', NEW.id,
        'pack_name', v_pack_title,
        'commenter', v_commenter_username
      )
    );
  END IF;
  
  -- Notify parent comment author if this is a reply
  IF NEW.parent_id IS NOT NULL THEN
    DECLARE
      v_parent_author_id UUID;
    BEGIN
      SELECT user_id INTO v_parent_author_id
      FROM pack_comments WHERE id = NEW.parent_id;
      
      -- Don't notify if replying to yourself
      IF v_parent_author_id != NEW.user_id THEN
        INSERT INTO notifications (user_id, type, actor_id, pack_id, metadata)
        VALUES (
          v_parent_author_id,
          'reply',
          NEW.user_id,
          NEW.pack_id,
          jsonb_build_object(
            'comment_id', NEW.id,
            'parent_id', NEW.parent_id,
            'pack_name', v_pack_title,
            'commenter', v_commenter_username
          )
        );
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_comment_created ON pack_comments;

-- Create trigger
CREATE TRIGGER on_comment_created
  AFTER INSERT ON pack_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_pack_owner_on_comment();
