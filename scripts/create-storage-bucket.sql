-- Create storage bucket for user photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-photos', 'user-photos', true);

-- Set up RLS policies for the bucket
CREATE POLICY "Users can upload their own photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view all photos" ON storage.objects
FOR SELECT USING (bucket_id = 'user-photos');

CREATE POLICY "Users can update their own photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
