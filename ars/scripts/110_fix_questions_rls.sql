-- Fix RLS policies for pack_questions table
-- Execute this in Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view questions" ON pack_questions;
DROP POLICY IF EXISTS "Authenticated users can ask questions" ON pack_questions;
DROP POLICY IF EXISTS "Users can update their own questions" ON pack_questions;
DROP POLICY IF EXISTS "Users can delete their own questions" ON pack_questions;

-- Policy: Anyone can view questions
CREATE POLICY "Anyone can view questions"
  ON pack_questions FOR SELECT
  USING (true);

-- Policy: Authenticated users can create questions
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
