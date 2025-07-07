-- Quick fix: Make user-photos bucket public
-- Run this single command in Supabase SQL editor

UPDATE storage.buckets 
SET public = true 
WHERE id = 'user-photos'; 