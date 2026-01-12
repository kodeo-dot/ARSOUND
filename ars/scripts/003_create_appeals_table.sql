-- Create appeals table for storing user appeals
CREATE TABLE IF NOT EXISTS appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better query performance
CREATE INDEX idx_appeals_user_id ON appeals(user_id);
CREATE INDEX idx_appeals_status ON appeals(status);
CREATE INDEX idx_appeals_created_at ON appeals(created_at);

-- Enable RLS on appeals table
ALTER TABLE appeals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own appeals
CREATE POLICY "Users can view their own appeals"
ON appeals FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can create their own appeals
CREATE POLICY "Users can create their own appeals"
ON appeals FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_appeals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER appeals_updated_at
BEFORE UPDATE ON appeals
FOR EACH ROW
EXECUTE FUNCTION update_appeals_updated_at();
