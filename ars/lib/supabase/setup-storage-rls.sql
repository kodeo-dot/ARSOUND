-- Setup RLS policies for avatars bucket
-- Make avatars publicly readable
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = owner
);

-- Policy to allow authenticated users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = owner
);

-- Policy to allow anyone to view avatars (public bucket)
CREATE POLICY "Avatars are publicly readable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- Policy to allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = owner
);

-- Same for samplepacks bucket
CREATE POLICY "Users can upload sample packs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'samplepacks' 
  AND auth.uid()::text = owner
);

CREATE POLICY "Sample packs are publicly readable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'samplepacks');

CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
WITH CHECK (
  bucket_id = 'samplepacks'
  AND auth.uid()::text = owner
);

CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'samplepacks'
  AND auth.uid()::text = owner
);
