import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TMDBService, filterByGenre } from './TMDBService';
import { AppError } from '@/types/errors';
import type { MovieSearchResult } from '@/types/productionTools';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makeMovie(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: 1,
    title: 'Blade Runner',
    release_date: '1982-06-25',
    poster_path: '/poster.jpg',
    genre_ids: [878, 18],
    ...overrides,
  };
}

describe('filterByGenre', () => {
  it('returns only movies containing the target genre', () => {
    const movies: MovieSearchResult[] = [
      { id: 1, title: 'A', releaseDate: '', posterPath: null, genreIds: [1, 2] },
      { id: 2, title: 'B', releaseDate: '', posterPath: null, genreIds: [3] },
      { id: 3, title: 'C', releaseDate: '', posterPath: null, genreIds: [1, 3] },
    ];
    const result = filterByGenre(movies, 1);
    expect(result).toHaveLength(2);
    expect(result.map((m) => m.id)).toEqual([1, 3]);
  });

  it('returns empty array when no movies match', () => {
    const movies: MovieSearchResult[] = [
      { id: 1, title: 'A', releaseDate: '', posterPath: null, genreIds: [2] },
    ];
    expect(filterByGenre(movies, 99)).toEqual([]);
  });

  it('returns empty array for empty input', () => {
    expect(filterByGenre([], 1)).toEqual([]);
  });
});

describe('TMDBService', () => {
  const service = new TMDBService('test-api-key');

  describe('searchMovies', () => {
    it('returns mapped movie results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [makeMovie()] }),
      });

      const results = await service.searchMovies('Blade Runner');
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        id: 1,
        title: 'Blade Runner',
        releaseDate: '1982-06-25',
        posterPath: '/poster.jpg',
        genreIds: [878, 18],
      });
    });

    it('passes query and api_key as URL params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      });

      await service.searchMovies('Blade Runner');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('query=Blade+Runner');
      expect(url).toContain('api_key=test-api-key');
    });

    it('adds year range params when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      });

      await service.searchMovies('test', { yearStart: 2000, yearEnd: 2010 });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('primary_release_date.gte=2000-01-01');
      expect(url).toContain('primary_release_date.lte=2010-12-31');
    });

    it('filters by genre client-side when genre option provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            makeMovie({ id: 1, genre_ids: [878, 18] }),
            makeMovie({ id: 2, genre_ids: [35] }),
          ],
        }),
      });

      const results = await service.searchMovies('test', { genre: 878 });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(1);
    });

    it('returns empty array for empty query', async () => {
      const results = await service.searchMovies('   ');
      expect(results).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('throws AppError on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      await expect(service.searchMovies('test')).rejects.toThrow(AppError);

      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));
      await expect(service.searchMovies('test')).rejects.toMatchObject({
        code: 'TMDB_SEARCH_FAILED',
        retryable: true,
      });
    });

    it('throws AppError on 429 rate limit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
      });

      await expect(service.searchMovies('test')).rejects.toMatchObject({
        code: 'TMDB_SEARCH_FAILED',
        retryable: true,
      });
    });

    it('throws non-retryable AppError on 401 invalid key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(service.searchMovies('test')).rejects.toMatchObject({
        code: 'TMDB_SEARCH_FAILED',
        retryable: false,
      });
    });

    it('handles missing results gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const results = await service.searchMovies('nonexistent');
      expect(results).toEqual([]);
    });
  });

  describe('getMovieImages', () => {
    it('returns mapped backdrops and stills', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          backdrops: [{ file_path: '/bd.jpg', width: 1920, height: 1080 }],
          stills: [{ file_path: '/st.jpg', width: 1280, height: 720 }],
        }),
      });

      const images = await service.getMovieImages(123);
      expect(images).toHaveLength(2);
      expect(images[0]).toEqual({
        filePath: '/bd.jpg',
        width: 1920,
        height: 1080,
        type: 'backdrop',
      });
      expect(images[1]).toEqual({
        filePath: '/st.jpg',
        width: 1280,
        height: 720,
        type: 'still',
      });
    });

    it('handles missing stills array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          backdrops: [{ file_path: '/bd.jpg', width: 1920, height: 1080 }],
        }),
      });

      const images = await service.getMovieImages(123);
      expect(images).toHaveLength(1);
    });

    it('throws AppError on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.getMovieImages(123)).rejects.toMatchObject({
        code: 'TMDB_IMAGES_FAILED',
        retryable: true,
      });
    });

    it('throws AppError on 429 rate limit', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 429 });

      await expect(service.getMovieImages(123)).rejects.toMatchObject({
        code: 'TMDB_IMAGES_FAILED',
        retryable: true,
      });
    });

    it('throws non-retryable AppError on 401', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });

      await expect(service.getMovieImages(123)).rejects.toMatchObject({
        code: 'TMDB_IMAGES_FAILED',
        retryable: false,
      });
    });
  });

  describe('getImageUrl', () => {
    it('constructs URL with default w500 size', () => {
      expect(service.getImageUrl('/poster.jpg')).toBe(
        'https://image.tmdb.org/t/p/w500/poster.jpg',
      );
    });

    it('constructs URL with w200 size', () => {
      expect(service.getImageUrl('/poster.jpg', 'w200')).toBe(
        'https://image.tmdb.org/t/p/w200/poster.jpg',
      );
    });

    it('constructs URL with original size', () => {
      expect(service.getImageUrl('/poster.jpg', 'original')).toBe(
        'https://image.tmdb.org/t/p/original/poster.jpg',
      );
    });
  });
});
