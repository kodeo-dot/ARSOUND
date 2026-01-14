-- This script documents that display_name is deprecated
-- We keep the column for backwards compatibility but it's no longer used

-- Add comment to the column to indicate it's deprecated
COMMENT ON COLUMN public.profiles.display_name IS 'DEPRECATED: Use username instead. This column is kept for backwards compatibility only.';

-- Note: We intentionally do NOT drop the column to avoid breaking existing data
-- If you want to clean up old data, you can run:
-- UPDATE public.profiles SET display_name = NULL WHERE display_name IS NOT NULL;

-- Verify all users have a username (this is now required)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.profiles WHERE username IS NULL OR username = ''
  ) THEN
    RAISE NOTICE 'WARNING: Found profiles without username. These need to be fixed manually.';
  ELSE
    RAISE NOTICE 'SUCCESS: All profiles have a username.';
  END IF;
END $$;
