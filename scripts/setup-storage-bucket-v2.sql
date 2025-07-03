-- Create storage bucket for user photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-photos',
  'user-photos',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Create storage policy for authenticated users to upload their own photos
CREATE POLICY "Users can upload their own photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policy for users to view their own photos
CREATE POLICY "Users can view their own photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policy for users to delete their own photos
CREATE POLICY "Users can delete their own photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to view photos (for profile viewing)
CREATE POLICY "Public can view user photos" ON storage.objects
FOR SELECT USING (bucket_id = 'user-photos');
