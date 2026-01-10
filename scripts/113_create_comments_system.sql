-- Drop old tables
DROP TABLE IF EXISTS pack_answers CASCADE;
DROP TABLE IF EXISTS pack_questions CASCADE;
DROP TABLE IF EXISTS pack_reviews CASCADE;

-- Create comments table
CREATE TABLE IF NOT EXISTS pack_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES pack_comments(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pack_comments_pack_id ON pack_comments(pack_id);
CREATE INDEX IF NOT EXISTS idx_pack_comments_user_id ON pack_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_pack_comments_parent_id ON pack_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_pack_comments_created_at ON pack_comments(created_at DESC);

-- Enable RLS
ALTER TABLE pack_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Anyone can view comments" ON pack_comments;
CREATE POLICY "Anyone can view comments"
  ON pack_comments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON pack_comments;
CREATE POLICY "Authenticated users can create comments"
  ON pack_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON pack_comments;
CREATE POLICY "Users can update their own comments"
  ON pack_comments FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON pack_comments;
CREATE POLICY "Users can delete their own comments"
  ON pack_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Function to notify on new comment
CREATE OR REPLACE FUNCTION notify_new_comment()
RETURNS TRIGGER AS $$
DECLARE
  pack_owner_id UUID;
  commenter_username TEXT;
  pack_title TEXT;
BEGIN
  -- Get pack owner and title
  SELECT user_id, title INTO pack_owner_id, pack_title
  FROM packs WHERE id = NEW.pack_id;
  
  -- Get commenter username
  SELECT username INTO commenter_username
  FROM profiles WHERE id = NEW.user_id;
  
  -- Only notify if comment is not from the pack owner
  IF NEW.user_id != pack_owner_id THEN
    IF NEW.parent_id IS NULL THEN
      -- New top-level comment
      INSERT INTO notifications (user_id, type, message, link, metadata)
      VALUES (
        pack_owner_id,
        'comment',
        commenter_username || ' comentó en tu pack',
        '/pack/' || NEW.pack_id,
        jsonb_build_object(
          'pack_id', NEW.pack_id,
          'pack_title', pack_title,
          'comment_id', NEW.id,
          'commenter_id', NEW.user_id,
          'commenter_username', commenter_username
        )
      );
    ELSE
      -- Reply to comment
      DECLARE
        parent_comment_user_id UUID;
      BEGIN
        SELECT user_id INTO parent_comment_user_id
        FROM pack_comments WHERE id = NEW.parent_id;
        
        -- Notify the person whose comment was replied to (if not themselves)
        IF parent_comment_user_id != NEW.user_id THEN
          INSERT INTO notifications (user_id, type, message, link, metadata)
          VALUES (
            parent_comment_user_id,
            'reply',
            commenter_username || ' respondió tu comentario',
            '/pack/' || NEW.pack_id,
            jsonb_build_object(
              'pack_id', NEW.pack_id,
              'pack_title', pack_title,
              'comment_id', NEW.id,
              'parent_comment_id', NEW.parent_id,
              'commenter_id', NEW.user_id,
              'commenter_username', commenter_username
            )
          );
        END IF;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for comment notifications
DROP TRIGGER IF EXISTS on_comment_created ON pack_comments;
CREATE TRIGGER on_comment_created
  AFTER INSERT ON pack_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_comment();
