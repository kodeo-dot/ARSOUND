-- Enable anyone to insert purchases (system operations)
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "System can insert purchases" ON purchases;
DROP POLICY IF EXISTS "Users can view their own purchases" ON purchases;

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
