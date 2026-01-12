-- Create reviews table
CREATE TABLE IF NOT EXISTS pack_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(pack_id, user_id)
);

-- Create indexes for reviews
CREATE INDEX IF NOT EXISTS idx_pack_reviews_pack_id ON pack_reviews(pack_id);
CREATE INDEX IF NOT EXISTS idx_pack_reviews_user_id ON pack_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_pack_reviews_rating ON pack_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_pack_reviews_created_at ON pack_reviews(created_at DESC);

-- Enable RLS for reviews
ALTER TABLE pack_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view reviews
CREATE POLICY "Anyone can view reviews"
  ON pack_reviews FOR SELECT
  USING (true);

-- Policy: Only users who purchased or downloaded the pack can review
CREATE POLICY "Users who purchased/downloaded can review"
  ON pack_reviews FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM purchases 
      WHERE purchases.buyer_id = auth.uid() 
      AND purchases.pack_id = pack_reviews.pack_id
      AND purchases.status = 'completed'
    )
    OR
    EXISTS (
      SELECT 1 FROM pack_downloads
      WHERE pack_downloads.user_id = auth.uid()
      AND pack_downloads.pack_id = pack_reviews.pack_id
    )
  );

-- Policy: Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
  ON pack_reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
  ON pack_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Create Q&A table
CREATE TABLE IF NOT EXISTS pack_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create answers table
CREATE TABLE IF NOT EXISTS pack_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES pack_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  is_pack_owner BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for Q&A
CREATE INDEX IF NOT EXISTS idx_pack_questions_pack_id ON pack_questions(pack_id);
CREATE INDEX IF NOT EXISTS idx_pack_questions_user_id ON pack_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_pack_questions_created_at ON pack_questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pack_answers_question_id ON pack_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_pack_answers_user_id ON pack_answers(user_id);

-- Enable RLS for Q&A
ALTER TABLE pack_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pack_answers ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view questions
CREATE POLICY "Anyone can view questions"
  ON pack_questions FOR SELECT
  USING (true);

-- Policy: Authenticated users can ask questions
CREATE POLICY "Authenticated users can ask questions"
  ON pack_questions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own questions
CREATE POLICY "Users can update their own questions"
  ON pack_questions FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own questions
CREATE POLICY "Users can delete their own questions"
  ON pack_questions FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Anyone can view answers
CREATE POLICY "Anyone can view answers"
  ON pack_answers FOR SELECT
  USING (true);

-- Policy: Authenticated users can answer questions
CREATE POLICY "Authenticated users can answer questions"
  ON pack_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own answers
CREATE POLICY "Users can update their own answers"
  ON pack_answers FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own answers
CREATE POLICY "Users can delete their own answers"
  ON pack_answers FOR DELETE
  USING (auth.uid() = user_id);

-- Add average rating to packs table
ALTER TABLE packs 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;

-- Function to update pack rating
CREATE OR REPLACE FUNCTION update_pack_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE packs
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM pack_reviews
      WHERE pack_id = COALESCE(NEW.pack_id, OLD.pack_id)
    ),
    reviews_count = (
      SELECT COUNT(*)
      FROM pack_reviews
      WHERE pack_id = COALESCE(NEW.pack_id, OLD.pack_id)
    )
  WHERE id = COALESCE(NEW.pack_id, OLD.pack_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update pack rating on review changes
DROP TRIGGER IF EXISTS trigger_update_pack_rating ON pack_reviews;
CREATE TRIGGER trigger_update_pack_rating
  AFTER INSERT OR UPDATE OR DELETE ON pack_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_pack_rating();
