-- Fix RLS policies for pack_answers table
-- Execute this in Supabase SQL Editor

-- Enable RLS if not enabled
ALTER TABLE pack_answers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view answers" ON pack_answers;
DROP POLICY IF EXISTS "Authenticated users can answer questions" ON pack_answers;
DROP POLICY IF EXISTS "Users can update their own answers" ON pack_answers;
DROP POLICY IF EXISTS "Users can delete their own answers" ON pack_answers;

-- Policy: Anyone can view answers
CREATE POLICY "Anyone can view answers"
  ON pack_answers FOR SELECT
  USING (true);

-- Policy: Authenticated users can create answers
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
