-- Test if user-photos storage bucket exists and check permissions
-- Run this in Supabase SQL editor to diagnose storage issues

-- 1. Check if the bucket exists
SELECT 
    id, 
    name, 
    public, 
    file_size_limit,
    allowed_mime_types,
    created_at,
    updated_at
FROM storage.buckets 
WHERE id = 'user-photos';

-- 2. Check storage policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%photo%';

-- 3. Check if RLS is enabled on storage.objects
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- 4. Test creating the bucket if it doesn't exist
-- Uncomment and run if bucket doesn't exist:
/*
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-photos', 'user-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;
*/ 