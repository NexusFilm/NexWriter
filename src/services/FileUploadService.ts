import { supabase } from '../lib/supabase';
import { AppError } from '../types/errors';
import type { IFileUploadService } from '../types/productionTools';

/**
 * Construct a user-scoped storage path.
 *
 * Conventions:
 *   shots/{userId}/{filename}
 *   agreements/{userId}/{filename}
 *   signatures/{userId}/{filename}
 *   lighting/{userId}/{filename}
 */
export function buildStoragePath(
  prefix: string,
  userId: string,
  filename: string,
): string {
  return `${prefix}/${userId}/${filename}`;
}

export class FileUploadService implements IFileUploadService {
  /**
   * Upload a file to Supabase Storage with upsert enabled.
   * Returns the storage path on success.
   */
  async uploadFile(bucket: string, path: string, file: File): Promise<string> {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });

    if (error) {
      throw new AppError(
        error.message,
        'UPLOAD_FAILED',
        'File upload failed. Please try again.',
        true,
      );
    }

    return path;
  }

  /**
   * Check whether the file's MIME type is in the allowed list.
   */
  validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  }

  /**
   * Check whether the file size is within the allowed limit.
   */
  validateFileSize(file: File, maxSizeMB: number): boolean {
    return file.size <= maxSizeMB * 1024 * 1024;
  }

  /**
   * Return the public URL for a file in Supabase Storage.
   */
  getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
}
