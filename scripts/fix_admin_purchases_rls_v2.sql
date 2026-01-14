-- Enable RLS for purchases table
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Webhook can insert purchases" ON purchases;
DROP POLICY IF EXISTS "Users can view their own purchases" ON purchases;
DROP POLICY IF EXISTS "Admins can view all purchases" ON purchases;

-- Allow insert operations for system/webhook operations
CREATE POLICY "Webhook can insert purchases"
  ON purchases
  FOR INSERT
  WITH CHECK (true);

-- Allow users to view their own purchases
CREATE POLICY "Users can view their own purchases"
  ON purchases
  FOR SELECT
  USING (buyer_id = auth.uid());

-- Allow admins to view all purchases
CREATE POLICY "Admins can view all purchases"
  ON purchases
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
