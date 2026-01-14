-- Create pack_questions table
CREATE TABLE IF NOT EXISTS pack_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for questions
CREATE INDEX IF NOT EXISTS idx_pack_questions_pack_id ON pack_questions(pack_id);
CREATE INDEX IF NOT EXISTS idx_pack_questions_user_id ON pack_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_pack_questions_created_at ON pack_questions(created_at DESC);

-- Enable RLS for questions
ALTER TABLE pack_questions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view questions
CREATE POLICY IF NOT EXISTS "Anyone can view questions"
  ON pack_questions FOR SELECT
  USING (true);

-- Policy: Authenticated users can ask questions
CREATE POLICY IF NOT EXISTS "Authenticated users can ask questions"
  ON pack_questions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own questions
CREATE POLICY IF NOT EXISTS "Users can delete their own questions"
  ON pack_questions FOR DELETE
  USING (auth.uid() = user_id);

-- Create pack_answers table
CREATE TABLE IF NOT EXISTS pack_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES pack_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for answers
CREATE INDEX IF NOT EXISTS idx_pack_answers_question_id ON pack_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_pack_answers_user_id ON pack_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_pack_answers_created_at ON pack_answers(created_at DESC);

-- Enable RLS for answers
ALTER TABLE pack_answers ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view answers
CREATE POLICY IF NOT EXISTS "Anyone can view answers"
  ON pack_answers FOR SELECT
  USING (true);

-- Policy: Authenticated users can answer questions
CREATE POLICY IF NOT EXISTS "Authenticated users can answer questions"
  ON pack_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own answers
CREATE POLICY IF NOT EXISTS "Users can delete their own answers"
  ON pack_answers FOR DELETE
  USING (auth.uid() = user_id);
