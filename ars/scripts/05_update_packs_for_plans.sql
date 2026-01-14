-- Add featured_priority column to packs table
ALTER TABLE packs ADD COLUMN IF NOT EXISTS featured_priority INTEGER DEFAULT 0;
ALTER TABLE packs ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE packs ADD COLUMN IF NOT EXISTS external_link TEXT;

-- Create index for featured priority sorting
CREATE INDEX IF NOT EXISTS idx_packs_featured_priority ON packs(featured_priority DESC, likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_packs_pinned ON packs(user_id, is_pinned) WHERE is_pinned = TRUE;
