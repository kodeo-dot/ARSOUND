-- Add file_hash column to packs table
ALTER TABLE packs ADD COLUMN file_hash TEXT UNIQUE;
CREATE INDEX idx_packs_file_hash ON packs(file_hash);

-- Create table to track reupload attempts
CREATE TABLE reupload_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_hash TEXT NOT NULL,
  pack_id_attempted UUID REFERENCES packs(id) ON DELETE SET NULL,
  attempt_count INTEGER DEFAULT 1,
  blocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, file_hash)
);

CREATE INDEX idx_reupload_attempts_user_id ON reupload_attempts(user_id);
CREATE INDEX idx_reupload_attempts_blocked_at ON reupload_attempts(blocked_at);

-- Enable RLS on reupload_attempts
ALTER TABLE reupload_attempts ENABLE ROW LEVEL SECURITY;

-- Add is_blocked column to profiles if it doesn't exist
ALTER TABLE profiles ADD COLUMN is_blocked BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN blocked_reason TEXT;
ALTER TABLE profiles ADD COLUMN blocked_at TIMESTAMP WITH TIME ZONE;

-- Policy for reupload_attempts table
CREATE POLICY "Users can view their own reupload attempts"
  ON reupload_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert reupload attempts"
  ON reupload_attempts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update reupload attempts"
  ON reupload_attempts FOR UPDATE
  USING (auth.uid() = user_id);
