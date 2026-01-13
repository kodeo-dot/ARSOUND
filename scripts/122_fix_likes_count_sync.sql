-- Fix likes count synchronization issues
-- This script will:
-- 1. Recalculate all likes_count from pack_likes table
-- 2. Recreate the trigger with better error handling
-- 3. Add logging for debugging

-- First, let's fix all existing likes_count to match reality
UPDATE packs
SET likes_count = COALESCE((
  SELECT COUNT(*)
  FROM pack_likes
  WHERE pack_likes.pack_id = packs.id
), 0);

-- Drop the old trigger and function
DROP TRIGGER IF EXISTS pack_likes_count_trigger ON public.pack_likes;
DROP FUNCTION IF EXISTS update_pack_likes_count();

-- Create improved function with better error handling
CREATE OR REPLACE FUNCTION update_pack_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- When a like is added, increment the counter
    UPDATE public.packs
    SET likes_count = COALESCE(likes_count, 0) + 1
    WHERE id = NEW.pack_id;
    
    -- If no rows were updated, the pack might not exist (shouldn't happen due to FK)
    IF NOT FOUND THEN
      RAISE WARNING 'Pack % not found when adding like', NEW.pack_id;
    END IF;
    
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- When a like is removed, decrement the counter (but never below 0)
    UPDATE public.packs
    SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1)
    WHERE id = OLD.pack_id;
    
    -- If no rows were updated, the pack might have been deleted
    IF NOT FOUND THEN
      RAISE WARNING 'Pack % not found when removing like', OLD.pack_id;
    END IF;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER pack_likes_count_trigger
  AFTER INSERT OR DELETE ON public.pack_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_pack_likes_count();

-- Add a function to manually sync likes count if needed
CREATE OR REPLACE FUNCTION sync_pack_likes_count(p_pack_id UUID DEFAULT NULL)
RETURNS TABLE (pack_id UUID, old_count INTEGER, new_count BIGINT) AS $$
BEGIN
  IF p_pack_id IS NOT NULL THEN
    -- Sync specific pack
    RETURN QUERY
    UPDATE packs
    SET likes_count = (
      SELECT COUNT(*)
      FROM pack_likes
      WHERE pack_likes.pack_id = packs.id
    )
    WHERE packs.id = p_pack_id
    RETURNING packs.id, packs.likes_count - (SELECT COUNT(*) FROM pack_likes WHERE pack_likes.pack_id = packs.id), packs.likes_count;
  ELSE
    -- Sync all packs
    RETURN QUERY
    WITH counts AS (
      SELECT 
        pack_likes.pack_id,
        COUNT(*) as actual_count
      FROM pack_likes
      GROUP BY pack_likes.pack_id
    )
    UPDATE packs
    SET likes_count = COALESCE(counts.actual_count, 0)
    FROM counts
    WHERE packs.id = counts.pack_id
    AND packs.likes_count != counts.actual_count
    RETURNING packs.id, packs.likes_count - COALESCE(counts.actual_count, 0), packs.likes_count;
    
    -- Also reset packs with no likes
    UPDATE packs
    SET likes_count = 0
    WHERE id NOT IN (SELECT DISTINCT pack_id FROM pack_likes)
    AND likes_count != 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION sync_pack_likes_count(UUID) TO authenticated;

COMMENT ON FUNCTION sync_pack_likes_count IS 'Manually synchronize likes_count with actual pack_likes records. Call with no parameter to sync all packs, or pass pack_id to sync specific pack.';

-- Verify the fix by showing packs with mismatched counts
DO $$
DECLARE
  mismatch_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mismatch_count
  FROM packs
  WHERE likes_count != COALESCE((
    SELECT COUNT(*)
    FROM pack_likes
    WHERE pack_likes.pack_id = packs.id
  ), 0);
  
  IF mismatch_count > 0 THEN
    RAISE NOTICE 'Found % packs with mismatched likes_count before fix', mismatch_count;
  ELSE
    RAISE NOTICE 'All packs have correct likes_count!';
  END IF;
END $$;
