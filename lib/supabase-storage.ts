// lib/supabase-storage.ts
// Helper functions untuk Supabase Storage

import { supabase } from './supabase';

export async function uploadFile(
  bucketName: string,
  filePath: string,
  file: File
): Promise<{ publicUrl: string; error: any }> {
  try {
    // Upload file
    const { data, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return {
      publicUrl: urlData.publicUrl,
      error: null
    };
  } catch (error) {
    return {
      publicUrl: '',
      error: error
    };
  }
}

export async function deleteFile(
  bucketName: string,
  filePath: string
): Promise<{ error: any }> {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    return { error };
  } catch (error) {
    return { error };
  }
}

export async function checkBucketExists(bucketName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error);
      return false;
    }

    const bucketExists = data?.some(bucket => bucket.name === bucketName);
    return bucketExists || false;
  } catch (error) {
    console.error('Error checking bucket:', error);
    return false;
  }
}
