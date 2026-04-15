import { useRef, useState } from 'react';
import { FileUploadService, buildStoragePath } from '@/services/FileUploadService';
import { useAuthStore } from '@/stores/authStore';
import styles from './ShotListPage.module.css';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 5;
const uploadService = new FileUploadService();

interface ImageUploadButtonProps {
  onUploaded: (storagePath: string) => void;
}

export function ImageUploadButton({ onUploaded }: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const user = useAuthStore((s) => s.user);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setError(null);

    if (!uploadService.validateFileType(file, ALLOWED_TYPES)) {
      setError('Only JPEG, PNG, or WebP images are allowed.');
      return;
    }

    if (!uploadService.validateFileSize(file, MAX_SIZE_MB)) {
      setError('Image must be under 5 MB.');
      return;
    }

    setUploading(true);
    try {
      const path = buildStoragePath('shots', user.id, `${Date.now()}_${file.name}`);
      await uploadService.uploadFile('production-assets', path, file);
      onUploaded(path);
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <button
        type="button"
        className={styles.imageUploadBtn}
        onClick={handleClick}
        disabled={uploading}
        aria-label="Upload reference image"
      >
        {uploading ? 'Uploading…' : '📷 Upload'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className={styles.hiddenInput}
        onChange={handleChange}
      />
      {error && <div className={styles.imageUploadError}>{error}</div>}
    </div>
  );
}
