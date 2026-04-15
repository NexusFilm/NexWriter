import type {
  ITMDBService,
  MovieSearchResult,
  TMDBImage,
} from '@/types/productionTools';
import { AppError } from '@/types/errors';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

/**
 * Pure function: filters movies whose genreIds array contains the target genre.
 * Exported separately for property testing.
 */
export function filterByGenre(
  movies: MovieSearchResult[],
  genreId: number,
): MovieSearchResult[] {
  return movies.filter((m) => m.genreIds.includes(genreId));
}

/**
 * Maps a raw TMDB API movie result to our MovieSearchResult type.
 */
function mapMovieResult(raw: Record<string, unknown>): MovieSearchResult {
  return {
    id: raw.id as number,
    title: (raw.title as string) ?? '',
    releaseDate: (raw.release_date as string) ?? '',
    posterPath: (raw.poster_path as string | null) ?? null,
    genreIds: (raw.genre_ids as number[]) ?? [],
  };
}

/**
 * Maps a raw TMDB backdrop object to our TMDBImage type.
 */
function mapBackdrop(raw: Record<string, unknown>): TMDBImage {
  return {
    filePath: raw.file_path as string,
    width: raw.width as number,
    height: raw.height as number,
    type: 'backdrop',
  };
}

/**
 * Maps a raw TMDB still/poster object to our TMDBImage type.
 */
function mapStill(raw: Record<string, unknown>): TMDBImage {
  return {
    filePath: raw.file_path as string,
    width: raw.width as number,
    height: raw.height as number,
    type: 'still',
  };
}

/**
 * Handles TMDB API response errors with appropriate AppError codes.
 */
async function handleResponseError(res: Response): Promise<never> {
  if (res.status === 429) {
    throw new AppError(
      'TMDB rate limit exceeded',
      'TMDB_SEARCH_FAILED',
      'Too many requests — please wait a moment and try again.',
      true,
    );
  }

  if (res.status === 401) {
    throw new AppError(
      'Invalid TMDB API key',
      'TMDB_SEARCH_FAILED',
      'Movie search is temporarily unavailable. Please try again later.',
      false,
    );
  }

  const body = await res.text().catch(() => '');
  throw new AppError(
    `TMDB API error ${res.status}: ${body}`,
    'TMDB_SEARCH_FAILED',
    'Movie search failed. Please try again.',
    true,
  );
}

/**
 * Dedicated TMDB API service — isolates all TMDB calls per TMDB ToS.
 */
export class TMDBService implements ITMDBService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? (import.meta.env.VITE_TMDB_API_KEY as string) ?? '';
  }

  async searchMovies(
    query: string,
    options?: { genre?: number; yearStart?: number; yearEnd?: number },
  ): Promise<MovieSearchResult[]> {
    if (!query.trim()) {
      return [];
    }

    const params = new URLSearchParams({
      query: query.trim(),
      api_key: this.apiKey,
    });

    if (options?.yearStart) {
      params.set('primary_release_date.gte', `${options.yearStart}-01-01`);
    }
    if (options?.yearEnd) {
      params.set('primary_release_date.lte', `${options.yearEnd}-12-31`);
    }

    let res: Response;
    try {
      res = await fetch(`${TMDB_BASE_URL}/search/movie?${params}`);
    } catch (err) {
      throw new AppError(
        `Network error searching TMDB: ${err instanceof Error ? err.message : String(err)}`,
        'TMDB_SEARCH_FAILED',
        'Could not reach the movie database. Check your connection and try again.',
        true,
      );
    }

    if (!res.ok) {
      await handleResponseError(res);
    }

    const data = await res.json();
    const results: unknown[] = data.results ?? [];
    let movies = results.map((r) =>
      mapMovieResult(r as Record<string, unknown>),
    );

    // Client-side genre filtering
    if (options?.genre != null) {
      movies = filterByGenre(movies, options.genre);
    }

    return movies;
  }

  async getMovieImages(movieId: number): Promise<TMDBImage[]> {
    const params = new URLSearchParams({ api_key: this.apiKey });

    let res: Response;
    try {
      res = await fetch(
        `${TMDB_BASE_URL}/movie/${movieId}/images?${params}`,
      );
    } catch (err) {
      throw new AppError(
        `Network error fetching TMDB images: ${err instanceof Error ? err.message : String(err)}`,
        'TMDB_IMAGES_FAILED',
        'Could not load movie images. Check your connection and try again.',
        true,
      );
    }

    if (!res.ok) {
      if (res.status === 429) {
        throw new AppError(
          'TMDB rate limit exceeded',
          'TMDB_IMAGES_FAILED',
          'Too many requests — please wait a moment and try again.',
          true,
        );
      }
      if (res.status === 401) {
        throw new AppError(
          'Invalid TMDB API key',
          'TMDB_IMAGES_FAILED',
          'Movie images are temporarily unavailable. Please try again later.',
          false,
        );
      }
      const body = await res.text().catch(() => '');
      throw new AppError(
        `TMDB API error ${res.status}: ${body}`,
        'TMDB_IMAGES_FAILED',
        'Failed to load movie images. Please try again.',
        true,
      );
    }

    const data = await res.json();
    const backdrops: unknown[] = data.backdrops ?? [];
    const stills: unknown[] = data.stills ?? [];

    return [
      ...backdrops.map((b) => mapBackdrop(b as Record<string, unknown>)),
      ...stills.map((s) => mapStill(s as Record<string, unknown>)),
    ];
  }

  getImageUrl(
    path: string,
    size: 'w200' | 'w500' | 'original' = 'w500',
  ): string {
    return `${TMDB_IMAGE_BASE}/${size}${path}`;
  }
}
