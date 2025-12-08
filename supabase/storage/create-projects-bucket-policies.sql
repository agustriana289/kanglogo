-- Create storage policies for projects bucket
-- Run this in Supabase SQL Editor if upload fails

-- Allow public read access
CREATE POLICY "Public read access for projects"
ON storage.objects FOR SELECT
USING (bucket_id = 'projects');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload projects"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'projects' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their own files
CREATE POLICY "Authenticated users can update projects"
ON storage.objects FOR UPDATE
USING (bucket_id = 'projects' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete projects"
ON storage.objects FOR DELETE
USING (bucket_id = 'projects' AND auth.role() = 'authenticated');
