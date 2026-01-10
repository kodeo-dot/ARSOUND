-- Update notifications constraint to include new types
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('follow', 'like', 'purchase', 'limit_reached', 'download', 'profile_view', 'review', 'question', 'answer'));

-- Trigger to create notification on new review
CREATE OR REPLACE FUNCTION notify_on_review()
RETURNS TRIGGER AS $$
DECLARE
  pack_owner_id UUID;
  pack_title TEXT;
BEGIN
  -- Get pack owner and title
  SELECT user_id, title INTO pack_owner_id, pack_title
  FROM packs
  WHERE id = NEW.pack_id;
  
  -- Only notify if reviewer is not the owner
  IF pack_owner_id != NEW.user_id THEN
    PERFORM create_notification(
      pack_owner_id,
      'review',
      NEW.user_id,
      NEW.pack_id,
      jsonb_build_object('rating', NEW.rating, 'pack_name', pack_title)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_on_review ON pack_reviews;
CREATE TRIGGER trigger_notify_on_review
  AFTER INSERT ON pack_reviews
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_review();

-- Trigger to create notification on new question
CREATE OR REPLACE FUNCTION notify_on_question()
RETURNS TRIGGER AS $$
DECLARE
  pack_owner_id UUID;
  pack_title TEXT;
BEGIN
  -- Get pack owner and title
  SELECT user_id, title INTO pack_owner_id, pack_title
  FROM packs
  WHERE id = NEW.pack_id;
  
  -- Only notify if question asker is not the owner
  IF pack_owner_id != NEW.user_id THEN
    PERFORM create_notification(
      pack_owner_id,
      'question',
      NEW.user_id,
      NEW.pack_id,
      jsonb_build_object('question', LEFT(NEW.question, 100), 'pack_name', pack_title)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_on_question ON pack_questions;
CREATE TRIGGER trigger_notify_on_question
  AFTER INSERT ON pack_questions
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_question();

-- Trigger to create notification on new answer
CREATE OR REPLACE FUNCTION notify_on_answer()
RETURNS TRIGGER AS $$
DECLARE
  question_owner_id UUID;
  question_text TEXT;
  pack_id_ref UUID;
BEGIN
  -- Get question owner, text, and pack_id
  SELECT user_id, question, pack_id INTO question_owner_id, question_text, pack_id_ref
  FROM pack_questions
  WHERE id = NEW.question_id;
  
  -- Only notify if answerer is not the question asker
  IF question_owner_id != NEW.user_id THEN
    PERFORM create_notification(
      question_owner_id,
      'answer',
      NEW.user_id,
      pack_id_ref,
      jsonb_build_object(
        'question', LEFT(question_text, 100),
        'answer', LEFT(NEW.answer, 100),
        'is_pack_owner', NEW.is_pack_owner
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_on_answer ON pack_answers;
CREATE TRIGGER trigger_notify_on_answer
  AFTER INSERT ON pack_answers
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_answer();
