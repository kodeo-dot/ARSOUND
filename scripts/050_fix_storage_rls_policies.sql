-- Fix Storage RLS Policies for Covers and Pack Files Upload
-- This script ensures authenticated users can upload files to the samplepacks bucket

-- First, drop existing policies to recreate them with correct permissions
DROP POLICY IF EXISTS "Anyone can view pack files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload pack files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own pack files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own pack files" ON storage.objects;

-- Recreate the samplepacks bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('samplepacks', 'samplepacks', true)
ON CONFLICT (id) DO NOTHING;

-- 1. SELECT policy: Anyone can view/download pack files (public bucket)
CREATE POLICY "Anyone can view pack files"
ON storage.objects FOR SELECT
USING (bucket_id = 'samplepacks');

-- 2. INSERT policy: Allow authenticated users to upload files
-- This is the critical policy for fixing the upload error
CREATE POLICY "Authenticated users can upload pack files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'samplepacks'
  AND auth.role() = 'authenticated'
);

-- 3. UPDATE policy: Allow authenticated users to update (for upsert functionality)
CREATE POLICY "Authenticated users can update pack files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'samplepacks'
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'samplepacks'
  AND auth.role() = 'authenticated'
);

-- 4. DELETE policy: Users can only delete their own files
CREATE POLICY "Users can delete their own pack files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'samplepacks'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Grant necessary permissions to authenticated users
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
