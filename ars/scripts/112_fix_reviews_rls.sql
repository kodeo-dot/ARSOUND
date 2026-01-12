-- Fix RLS policies for pack_reviews table
-- Execute this in Supabase SQL Editor

-- Enable RLS if not enabled
ALTER TABLE pack_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view reviews" ON pack_reviews;
DROP POLICY IF EXISTS "Users who purchased/downloaded can review" ON pack_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON pack_reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON pack_reviews;

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
