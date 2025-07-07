-- Fix private bucket issue - make user-photos bucket public
-- Run this in Supabase SQL editor

-- Make the existing bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'user-photos';

-- Verify the change
SELECT id, name, public 
FROM storage.buckets 
WHERE id = 'user-photos';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;

-- Create RLS policies for the bucket
-- Allow authenticated users to upload their own photos
CREATE POLICY "Users can upload their own photos" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'user-photos' 
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to view photos (since they're public)
CREATE POLICY "Users can view all photos" ON storage.objects
FOR SELECT USING (bucket_id = 'user-photos');

-- Allow users to update their own photos
CREATE POLICY "Users can update their own photos" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'user-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own photos" ON storage.objects
FOR DELETE USING (
    bucket_id = 'user-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Verify the bucket was created
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'user-photos'; 