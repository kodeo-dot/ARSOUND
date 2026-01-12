-- Add missing foreign key from appeals.user_id to profiles.id for proper joins
-- This allows Supabase to automatically join appeals with profiles

-- First, ensure all user_ids in appeals exist in profiles
-- (This is just a safety check, should already be true)
DELETE FROM appeals 
WHERE user_id NOT IN (SELECT id FROM profiles);

-- Add the foreign key constraint
ALTER TABLE appeals 
  DROP CONSTRAINT IF EXISTS appeals_user_id_fkey_profiles,
  ADD CONSTRAINT appeals_user_id_fkey_profiles 
  FOREIGN KEY (user_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

-- Create an index for better join performance
CREATE INDEX IF NOT EXISTS idx_appeals_user_id_profiles ON appeals(user_id);
