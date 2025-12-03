-- Create bucket for payment proofs if not exists
-- Run this in Supabase SQL Editor

-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for payment-proofs bucket
-- Allow public read access
CREATE POLICY "Public read access for payment proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own payment proofs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'payment-proofs' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own payment proofs"
ON storage.objects FOR DELETE
USING (bucket_id = 'payment-proofs' AND auth.role() = 'authenticated');
