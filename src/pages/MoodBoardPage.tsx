import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useMoodBoardStore } from '@/stores/moodBoardStore';
import { DashboardToolbar } from '@/components/dashboard/DashboardToolbar';
import { MoodBoardRepository } from '@/repositories/MoodBoardRepository';
import { TMDBService } from '@/services/TMDBService';
import {
  analyzeImageUrl,
  getFallbackAnalysis,
  type ContrastRead,
  type LightingRead,
  type PaletteRead,
  type SettingRead,
  type VisualAnalysis,
} from '@/services/VisualAnalysisService';
import type { MoodBoard, MovieSearchResult, TMDBImage } from '@/types/productionTools';
import styles from './MoodBoardPage.module.css';

const moodBoardRepo = new MoodBoardRepository();
const tmdbService = new TMDBService();

type ImageTypeFilter = 'all' | TMDBImage['type'];
type AspectFilter = 'all' | 'wide' | 'scope' | 'portrait' | 'square';
type FilterMap = Record<string, VisualAnalysis>;
type FeaturedFrame = {
  movie: MovieSearchResult;
  image: TMDBImage;
};

const VISUAL_RECIPES = [
  { label: 'Low-key crime', query: 'Se7en', note: 'Dark rooms, silhouettes, pressure.' },
  { label: 'High-key romance', query: 'La La Land', note: 'Clean color, bright faces, movement.' },
  { label: 'Warm interiors', query: 'Her', note: 'Soft rooms, amber practicals, intimacy.' },
  { label: 'Cool sci-fi', query: 'Arrival', note: 'Blue-gray scale, mist, negative space.' },
  { label: 'Day exteriors', query: 'Nomadland', note: 'Natural light, open air, horizon.' },
  { label: 'Neon night', query: 'Drive', note: 'Color contrast, streets, glow.' },
];

const FEATURED_FALLBACKS: MovieSearchResult[] = [
  { id: 38, title: 'Eternal Sunshine of the Spotless Mind', releaseDate: '2004-03-19', posterPath: null, genreIds: [] },
  { id: 335984, title: 'Blade Runner 2049', releaseDate: '2017-10-04', posterPath: null, genreIds: [] },
  { id: 376867, title: 'Moonlight', releaseDate: '2016-10-21', posterPath: null, genreIds: [] },
  { id: 329865, title: 'Arrival', releaseDate: '2016-11-10', posterPath: null, genreIds: [] },
  { id: 64690, title: 'Drive', releaseDate: '2011-09-15', posterPath: null, genreIds: [] },
  { id: 77338, title: 'The Intouchables', releaseDate: '2011-11-02', posterPath: null, genreIds: [] },
];

async function buildFeaturedFrames(movies: MovieSearchResult[]): Promise<FeaturedFrame[]> {
  const frameSets = await Promise.all(
    movies.slice(0, 10).map(async (movie) => {
      try {
        const images = await tmdbService.getMovieImages(movie.id);
        const usableImages = images.filter((image) => image.type === 'backdrop' || image.type === 'still');
        return usableImages.slice(0, 2).map((image) => ({ movie, image }));
      } catch {
        return [];
      }
    }),
  );

  return frameSets.flat().slice(0, 12);
}

function getAspectBucket(image: TMDBImage): Exclude<AspectFilter, 'all'> {
  const ratio = image.width / Math.max(image.height, 1);
  if (ratio >= 2.05) return 'scope';
  if (ratio >= 1.35) return 'wide';
  if (ratio <= 0.85) return 'portrait';
  return 'square';
}

function formatImageRatio(image: TMDBImage): string {
  const ratio = image.width / Math.max(image.height, 1);
  if (ratio >= 2.05) return 'Scope';
  if (ratio >= 1.35) return 'Wide';
  if (ratio <= 0.85) return 'Portrait';
  return 'Square';
}

function sanitizeFilename(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80) || 'reference';
}

export function MoodBoardPage() {
  const user = useAuthStore((s) => s.user);

  const boards = useMoodBoardStore((s) => s.boards);
  const searchResults = useMoodBoardStore((s) => s.searchResults);
  const movieImages = useMoodBoardStore((s) => s.movieImages);
  const setBoards = useMoodBoardStore((s) => s.setBoards);
  const setSearchResults = useMoodBoardStore((s) => s.setSearchResults);
  const setMovieImages = useMoodBoardStore((s) => s.setMovieImages);

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [newBoardName, setNewBoardName] = useState('');
  const [savingBoard, setSavingBoard] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageTypeFilter, setImageTypeFilter] = useState<ImageTypeFilter>('all');
  const [aspectFilter, setAspectFilter] = useState<AspectFilter>('all');
  const [lightingFilter, setLightingFilter] = useState<LightingRead | 'all'>('all');
  const [contrastFilter, setContrastFilter] = useState<ContrastRead | 'all'>('all');
  const [paletteFilter, setPaletteFilter] = useState<PaletteRead | 'all'>('all');
  const [settingFilter, setSettingFilter] = useState<SettingRead | 'all'>('all');
  const [visualAnalysis, setVisualAnalysis] = useState<FilterMap>({});
  const [analyzingVisuals, setAnalyzingVisuals] = useState(false);
  const [featuredMovies, setFeaturedMovies] = useState<MovieSearchResult[]>(FEATURED_FALLBACKS);
  const [featuredFrames, setFeaturedFrames] = useState<FeaturedFrame[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  // Load boards on mount
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      try {
        const data = await moodBoardRepo.getBoards(user!.id);
        if (!cancelled) setBoards(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load boards');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user, setBoards]);

  useEffect(() => {
    let cancelled = false;

    async function loadFeatured() {
      setLoadingFeatured(true);
      try {
        const trending = await tmdbService.getTrendingMovies().catch(() => FEATURED_FALLBACKS);
        const featured = trending.length > 0 ? trending : FEATURED_FALLBACKS;
        const frames = await buildFeaturedFrames(featured);

        if (!cancelled) {
          setFeaturedMovies(featured);
          setFeaturedFrames(frames);
        }
      } finally {
        if (!cancelled) setLoadingFeatured(false);
      }
    }

    loadFeatured();
    return () => { cancelled = true; };
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    setSelectedMovieId(null);
    setMovieImages([]);
    try {
      const results = await tmdbService.searchMovies(query);
      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  }, [query, setSearchResults, setMovieImages]);

  const handleSelectMovie = useCallback(async (movieId: number) => {
    setSelectedMovieId(movieId);
    setError(null);
    setVisualAnalysis({});
    try {
      const images = await tmdbService.getMovieImages(movieId);
      setMovieImages(images);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load images');
    }
  }, [setMovieImages]);

  const handleOpenFeaturedMovie = useCallback(async (movie: MovieSearchResult) => {
    setSearchResults(
      searchResults.some((item) => item.id === movie.id)
        ? searchResults
        : [movie, ...searchResults],
    );
    await handleSelectMovie(movie.id);
  }, [handleSelectMovie, searchResults, setSearchResults]);

  const handleOpenFeaturedFrame = useCallback(async (frame: FeaturedFrame) => {
    await handleOpenFeaturedMovie(frame.movie);
  }, [handleOpenFeaturedMovie]);

  const handleCreateBoard = useCallback(async () => {
    if (!user || !newBoardName.trim()) return;
    try {
      const board = await moodBoardRepo.createBoard({
        userId: user.id,
        scriptId: null,
        name: newBoardName.trim(),
      });
      setBoards([board, ...boards]);
      setNewBoardName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create board');
    }
  }, [user, newBoardName, boards, setBoards]);

  const handleSaveImage = useCallback(async (image: TMDBImage, board: MoodBoard) => {
    if (!selectedMovieId) return;
    setSavingBoard(board.id);
    try {
      await moodBoardRepo.saveImage({
        moodBoardId: board.id,
        tmdbImagePath: image.filePath,
        tmdbMovieId: selectedMovieId,
        note: '',
        tags: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save image');
    } finally {
      setSavingBoard(null);
    }
  }, [selectedMovieId]);

  useEffect(() => {
    if (movieImages.length === 0) {
      setVisualAnalysis({});
      setAnalyzingVisuals(false);
      return;
    }

    let cancelled = false;
    setAnalyzingVisuals(true);

    async function analyzeImages() {
      const entries = await Promise.all(
        movieImages.map(async (image) => {
          try {
            const analysis = await analyzeImageUrl(tmdbService.getImageUrl(image.filePath, 'w500'));
            return [image.filePath, analysis] as const;
          } catch {
            return [image.filePath, getFallbackAnalysis()] as const;
          }
        }),
      );

      if (!cancelled) {
        setVisualAnalysis(Object.fromEntries(entries));
        setAnalyzingVisuals(false);
      }
    }

    analyzeImages();
    return () => { cancelled = true; };
  }, [movieImages]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  }, [handleSearch]);

  const handleRecipeClick = useCallback((recipeQuery: string) => {
    setQuery(recipeQuery);
  }, []);

  const handleOpenRecipe = useCallback(async (recipeQuery: string) => {
    setQuery(recipeQuery);
    setSearching(true);
    setError(null);
    setSelectedMovieId(null);
    setMovieImages([]);

    try {
      const results = await tmdbService.searchMovies(recipeQuery);
      setSearchResults(results);
      if (results[0]) {
        await handleSelectMovie(results[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  }, [handleSelectMovie, setMovieImages, setSearchResults]);

  const selectedMovie = searchResults.find((movie) => movie.id === selectedMovieId);

  const handleDownloadImage = useCallback(async (image: TMDBImage, index: number) => {
    const url = tmdbService.getImageUrl(image.filePath, 'original');
    const filename = `${sanitizeFilename(selectedMovie?.title ?? 'nexwriter-reference')}-${image.type}-${index + 1}.jpg`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [selectedMovie]);

  const filteredImages = useMemo(() => (
    movieImages.filter((image) => {
      const analysis = visualAnalysis[image.filePath];
      if (imageTypeFilter !== 'all' && image.type !== imageTypeFilter) return false;
      if (aspectFilter !== 'all' && getAspectBucket(image) !== aspectFilter) return false;
      if (lightingFilter !== 'all' && analysis?.lighting !== lightingFilter) return false;
      if (contrastFilter !== 'all' && analysis?.contrast !== contrastFilter) return false;
      if (paletteFilter !== 'all' && analysis?.palette !== paletteFilter) return false;
      if (settingFilter !== 'all' && analysis?.setting !== settingFilter) return false;
      return true;
    })
  ), [
    aspectFilter,
    contrastFilter,
    imageTypeFilter,
    lightingFilter,
    movieImages,
    paletteFilter,
    settingFilter,
    visualAnalysis,
  ]);

  const clearFilters = useCallback(() => {
    setImageTypeFilter('all');
    setAspectFilter('all');
    setLightingFilter('all');
    setContrastFilter('all');
    setPaletteFilter('all');
    setSettingFilter('all');
  }, []);

  const hasActiveFilters =
    imageTypeFilter !== 'all'
    || aspectFilter !== 'all'
    || lightingFilter !== 'all'
    || contrastFilter !== 'all'
    || paletteFilter !== 'all'
    || settingFilter !== 'all';

  if (loading) {
    return (
      <div className={styles.page}>
        <DashboardToolbar />
        <main className={styles.workspace}>
          <div className={styles.loading}>Loading mood boards…</div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <DashboardToolbar />

      <main className={styles.workspace}>
        <section className={styles.command}>
          <div className={styles.commandCopy}>
            <span className={styles.eyebrow}>Visual research</span>
            <h1 className={styles.title}>Build the look before production.</h1>
            <p className={styles.subtitle}>
              Search film references, collect stills, and keep every board close to your screenplay.
            </p>
          </div>

          <div className={styles.searchPanel}>
            <label className={styles.searchLabel} htmlFor="mood-search">
              Find reference frames
            </label>
            <div className={styles.searchBar}>
              <input
                id="mood-search"
                className={styles.searchInput}
                type="text"
                placeholder="Search movies on TMDB"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              <button
                className={styles.searchBtn}
                onClick={handleSearch}
                disabled={searching || !query.trim()}
              >
                {searching ? 'Searching' : 'Search'}
              </button>
            </div>
            <div className={styles.quickSearches} aria-label="Quick searches">
              {VISUAL_RECIPES.map((recipe) => (
                <button
                  key={recipe.label}
                  type="button"
                  className={styles.quickSearch}
                  onClick={() => handleRecipeClick(recipe.query)}
                >
                  {recipe.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.contentGrid}>
          <section className={styles.main} aria-label="Movie references">
            {!selectedMovieId && searchResults.length === 0 && (
              <div className={styles.featuredStack}>
                <div className={styles.sectionHeader}>
                  <div>
                    <span className={styles.sectionMeta}>
                      {loadingFeatured ? 'Loading featured frames' : 'Featured frames'}
                    </span>
                    <h2 className={styles.sectionTitle}>Start with a frame</h2>
                  </div>
                  <span className={styles.sectionHint}>Titles are context</span>
                </div>

                <div className={styles.featuredGrid}>
                  {featuredFrames.length > 0 ? featuredFrames.map((frame, index) => (
                    <button
                      type="button"
                      key={`${frame.movie.id}-${frame.image.filePath}-${index}`}
                      className={styles.featuredCard}
                      onClick={() => handleOpenFeaturedFrame(frame)}
                    >
                      <img
                        src={tmdbService.getImageUrl(frame.image.filePath, 'w500')}
                        alt={`${frame.movie.title} reference frame`}
                        loading="lazy"
                      />
                      <span className={styles.featuredOverlay}>
                        <span>{formatImageRatio(frame.image)} frame</span>
                        <strong>{frame.movie.title}</strong>
                        <em>{frame.movie.releaseDate ? frame.movie.releaseDate.slice(0, 4) : 'Open references'}</em>
                      </span>
                    </button>
                  )) : featuredMovies.slice(0, 8).map((movie) => (
                    <button
                      type="button"
                      key={movie.id}
                      className={styles.featuredCard}
                      onClick={() => handleOpenFeaturedMovie(movie)}
                    >
                      {movie.posterPath ? (
                        <img
                          src={tmdbService.getImageUrl(movie.posterPath, 'w500')}
                          alt={movie.title}
                          loading="lazy"
                        />
                      ) : (
                        <span className={styles.featuredFallback} aria-hidden="true" />
                      )}
                      <span className={styles.featuredOverlay}>
                        <span>Featured title</span>
                        <strong>{movie.title}</strong>
                        <em>{movie.releaseDate ? movie.releaseDate.slice(0, 4) : 'Open references'}</em>
                      </span>
                    </button>
                  ))}
                </div>

                <div className={styles.recipeGrid}>
                  {VISUAL_RECIPES.map((recipe) => (
                    <button
                      type="button"
                      key={recipe.label}
                      className={styles.recipeCard}
                      onClick={() => handleOpenRecipe(recipe.query)}
                    >
                      <span>{recipe.label}</span>
                      <strong>{recipe.note}</strong>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {searchResults.length > 0 && !selectedMovieId && (
              <>
                <div className={styles.sectionHeader}>
                  <div>
                    <span className={styles.sectionMeta}>{searchResults.length} matches</span>
                    <h2 className={styles.sectionTitle}>Choose a film</h2>
                  </div>
                  <span className={styles.sectionHint}>Next: open images</span>
                </div>
                <div className={styles.movieGrid}>
                  {searchResults.map((movie) => (
                    <button
                      type="button"
                      key={movie.id}
                      className={styles.movieCard}
                      onClick={() => handleSelectMovie(movie.id)}
                    >
                      {movie.posterPath ? (
                        <img
                          className={styles.moviePoster}
                          src={tmdbService.getImageUrl(movie.posterPath, 'w200')}
                          alt={movie.title}
                          loading="lazy"
                        />
                      ) : (
                        <div className={styles.noPoster}>No poster</div>
                      )}
                      <span className={styles.movieInfo}>
                        <span className={styles.movieTitle}>{movie.title}</span>
                        <span className={styles.movieYear}>
                          {movie.releaseDate ? movie.releaseDate.slice(0, 4) : 'Year unknown'}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {selectedMovieId && movieImages.length > 0 && (
              <>
                <div className={styles.resultsToolbar}>
                  <div>
                    <span className={styles.sectionMeta}>
                      {filteredImages.length} of {movieImages.length} images
                      {analyzingVisuals ? ' · reading visuals' : ''}
                    </span>
                    <h2 className={styles.sectionTitle}>
                      {selectedMovie?.title ?? 'Film images'}
                    </h2>
                  </div>
                  <button
                    className={styles.secondaryBtn}
                    onClick={() => { setSelectedMovieId(null); setMovieImages([]); }}
                  >
                    Back to films
                  </button>
                </div>
                <div className={styles.finderPanel} aria-label="Visual filters">
                  <div className={styles.finderHeader}>
                    <div>
                      <span className={styles.finderKicker}>Visual finder</span>
                      <h3>Filter by the look, not just the title.</h3>
                    </div>
                    {hasActiveFilters && (
                      <button className={styles.clearBtn} type="button" onClick={clearFilters}>
                        Clear
                      </button>
                    )}
                  </div>

                  <div className={styles.filterGrid}>
                    <label className={styles.filterField}>
                      <span>Image type</span>
                      <select value={imageTypeFilter} onChange={(e) => setImageTypeFilter(e.target.value as ImageTypeFilter)}>
                        <option value="all">All</option>
                        <option value="backdrop">Backdrops</option>
                        <option value="still">Stills</option>
                        <option value="poster">Posters</option>
                      </select>
                    </label>
                    <label className={styles.filterField}>
                      <span>Aspect ratio</span>
                      <select value={aspectFilter} onChange={(e) => setAspectFilter(e.target.value as AspectFilter)}>
                        <option value="all">All</option>
                        <option value="wide">Wide / 16:9</option>
                        <option value="scope">Scope / 2.35</option>
                        <option value="portrait">Portrait</option>
                        <option value="square">Square-ish</option>
                      </select>
                    </label>
                    <label className={styles.filterField}>
                      <span>Lighting</span>
                      <select value={lightingFilter} onChange={(e) => setLightingFilter(e.target.value as LightingRead | 'all')}>
                        <option value="all">All</option>
                        <option value="high-key">High key</option>
                        <option value="low-key">Low key</option>
                        <option value="balanced">Balanced</option>
                      </select>
                    </label>
                    <label className={styles.filterField}>
                      <span>Contrast ratio</span>
                      <select value={contrastFilter} onChange={(e) => setContrastFilter(e.target.value as ContrastRead | 'all')}>
                        <option value="all">All</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </label>
                    <label className={styles.filterField}>
                      <span>Color scheme</span>
                      <select value={paletteFilter} onChange={(e) => setPaletteFilter(e.target.value as PaletteRead | 'all')}>
                        <option value="all">All</option>
                        <option value="warm">Warm</option>
                        <option value="cool">Cool</option>
                        <option value="neutral">Neutral</option>
                        <option value="vivid">Vivid</option>
                      </select>
                    </label>
                    <label className={styles.filterField}>
                      <span>Setting read</span>
                      <select value={settingFilter} onChange={(e) => setSettingFilter(e.target.value as SettingRead | 'all')}>
                        <option value="all">All</option>
                        <option value="interior">Interior</option>
                        <option value="exterior">Exterior</option>
                        <option value="mixed">Mixed</option>
                      </select>
                    </label>
                  </div>
                </div>
                <div className={styles.imageGrid}>
                  {filteredImages.map((img, idx) => {
                    const analysis = visualAnalysis[img.filePath];
                    return (
                    <div key={`${img.filePath}-${idx}`} className={styles.imageCard}>
                      <img
                        className={styles.imageThumb}
                        src={tmdbService.getImageUrl(img.filePath, 'w500')}
                        alt={`${img.type} image`}
                        loading="lazy"
                        onClick={() => setLightboxImage(tmdbService.getImageUrl(img.filePath, 'original'))}
                      />
                      <div className={styles.imageBadges}>
                        <span>{formatImageRatio(img)}</span>
                        {analysis && (
                          <>
                            <span>{analysis.lighting}</span>
                            <span>{analysis.contrast} contrast</span>
                            <span>{analysis.palette}</span>
                          </>
                        )}
                      </div>
                      <div className={styles.imageOverlay}>
                        <div>
                          <span className={styles.imageType}>{img.type}</span>
                          {analysis && <span className={styles.imageRead}>{analysis.setting} read</span>}
                        </div>
                        <div className={styles.imageActions}>
                          <button
                            type="button"
                            className={styles.downloadBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadImage(img, idx);
                            }}
                          >
                            Download
                          </button>
                          {boards.length > 0 && (
                            <select
                              className={styles.saveSelect}
                              value=""
                              onChange={(e) => {
                                const board = boards.find((b) => b.id === e.target.value);
                                if (board) handleSaveImage(img, board);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              disabled={savingBoard !== null}
                              aria-label="Save image to board"
                            >
                              <option value="" disabled>Save</option>
                              {boards.map((b) => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    </div>
                  );})}
                </div>
                {filteredImages.length === 0 && (
                  <div className={styles.emptyState}>
                    <span className={styles.emptyKicker}>No matches</span>
                    <h2>Loosen one filter and scan again.</h2>
                    <p>These reads come from image dimensions and client-side color analysis, so broad filters work best.</p>
                    <button className={styles.secondaryBtn} type="button" onClick={clearFilters}>
                      Clear filters
                    </button>
                  </div>
                )}
              </>
            )}

            {selectedMovieId && movieImages.length === 0 && (
              <div className={styles.emptyState}>
                <span className={styles.emptyKicker}>No images found</span>
                <h2>Try another film title.</h2>
                <p>Some TMDB records do not include production stills or backdrops.</p>
                <button
                  className={styles.secondaryBtn}
                  onClick={() => { setSelectedMovieId(null); setMovieImages([]); }}
                >
                  Back to films
                </button>
              </div>
            )}
          </section>

          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <div>
                <span className={styles.sidebarEyebrow}>Boards</span>
                <h2 className={styles.sidebarTitle}>Your collections</h2>
              </div>
              <span className={styles.boardCount}>{boards.length}</span>
            </div>

            <div className={styles.boardList}>
              {boards.length === 0 ? (
                <p className={styles.emptyBoards}>Create a board before saving frames.</p>
              ) : (
                boards.map((board) => (
                  <Link
                    key={board.id}
                    to={`/moodboard/${board.id}`}
                    className={styles.boardItem}
                  >
                    <span>{board.name}</span>
                    <span aria-hidden="true">View</span>
                  </Link>
                ))
              )}
            </div>

            <div className={styles.newBoardRow}>
              <label className={styles.newBoardLabel} htmlFor="new-board-name">
                New board
              </label>
              <div className={styles.newBoardControls}>
                <input
                  id="new-board-name"
                  className={styles.newBoardInput}
                  type="text"
                  placeholder="Board name"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreateBoard(); }}
                />
                <button
                  className={styles.newBoardBtn}
                  onClick={handleCreateBoard}
                  disabled={!newBoardName.trim()}
                >
                  Create
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {lightboxImage && (
        <div
          className={styles.lightbox}
          onClick={() => setLightboxImage(null)}
          role="dialog"
          aria-label="Image lightbox"
        >
          <img
            className={styles.lightboxImg}
            src={lightboxImage}
            alt="Full resolution"
          />
        </div>
      )}
    </div>
  );
}
