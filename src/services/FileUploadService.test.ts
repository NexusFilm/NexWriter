import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileUploadService, buildStoragePath } from './FileUploadService';
import { AppError } from '../types/errors';

const uploadMock = vi.fn();
const getPublicUrlMock = vi.fn();
const fromMock = vi.fn(() => ({
  upload: uploadMock,
  getPublicUrl: getPublicUrlMock,
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    storage: {
      from: (...args: unknown[]) => fromMock(...args),
    },
  },
}));

function makeFile(name: string, size: number, type: string): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

describe('FileUploadService', () => {
  let service: FileUploadService;

  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockReturnValue({ upload: uploadMock, getPublicUrl: getPublicUrlMock });
    service = new FileUploadService();
  });

  describe('uploadFile', () => {
    it('returns the path on successful upload', async () => {
      uploadMock.mockResolvedValue({ error: null });

      const file = makeFile('photo.jpg', 1024, 'image/jpeg');
      const result = await service.uploadFile('media', 'shots/user1/photo.jpg', file);

      expect(fromMock).toHaveBeenCalledWith('media');
      expect(result).toBe('shots/user1/photo.jpg');
    });

    it('throws AppError with UPLOAD_FAILED on storage error', async () => {
      uploadMock.mockResolvedValue({
        error: { message: 'Quota exceeded' },
      });

      const file = makeFile('photo.jpg', 1024, 'image/jpeg');

      try {
        await service.uploadFile('media', 'shots/user1/photo.jpg', file);
        expect.unreachable('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        const appErr = err as AppError;
        expect(appErr.code).toBe('UPLOAD_FAILED');
        expect(appErr.retryable).toBe(true);
        expect(appErr.userMessage).toBe('File upload failed. Please try again.');
      }
    });
  });

  describe('validateFileType', () => {
    it('returns true when file type is in allowed list', () => {
      const file = makeFile('img.png', 100, 'image/png');
      expect(service.validateFileType(file, ['image/jpeg', 'image/png', 'image/webp'])).toBe(true);
    });

    it('returns false when file type is not in allowed list', () => {
      const file = makeFile('doc.pdf', 100, 'application/pdf');
      expect(service.validateFileType(file, ['image/jpeg', 'image/png'])).toBe(false);
    });

    it('returns false for empty allowed list', () => {
      const file = makeFile('img.png', 100, 'image/png');
      expect(service.validateFileType(file, [])).toBe(false);
    });
  });

  describe('validateFileSize', () => {
    it('returns true when file size is within limit', () => {
      const file = makeFile('img.png', 4 * 1024 * 1024, 'image/png');
      expect(service.validateFileSize(file, 5)).toBe(true);
    });

    it('returns true when file size equals the limit exactly', () => {
      const file = makeFile('img.png', 5 * 1024 * 1024, 'image/png');
      expect(service.validateFileSize(file, 5)).toBe(true);
    });

    it('returns false when file size exceeds limit', () => {
      const file = makeFile('img.png', 6 * 1024 * 1024, 'image/png');
      expect(service.validateFileSize(file, 5)).toBe(false);
    });
  });

  describe('getPublicUrl', () => {
    it('returns the public URL from Supabase Storage', () => {
      getPublicUrlMock.mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/media/shots/user1/photo.jpg' },
      });

      const url = service.getPublicUrl('media', 'shots/user1/photo.jpg');
      expect(fromMock).toHaveBeenCalledWith('media');
      expect(url).toBe('https://storage.example.com/media/shots/user1/photo.jpg');
    });
  });
});

describe('buildStoragePath', () => {
  it('constructs path as prefix/userId/filename', () => {
    expect(buildStoragePath('shots', 'user-123', 'photo.jpg')).toBe(
      'shots/user-123/photo.jpg',
    );
  });

  it('works for all defined prefixes', () => {
    const prefixes = ['shots', 'agreements', 'signatures', 'lighting'];
    for (const prefix of prefixes) {
      const result = buildStoragePath(prefix, 'uid', 'file.ext');
      expect(result).toBe(`${prefix}/uid/file.ext`);
    }
  });
});
