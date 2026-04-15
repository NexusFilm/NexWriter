import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useMoodBoardStore } from '@/stores/moodBoardStore';
import { MoodBoardRepository } from '@/repositories/MoodBoardRepository';
import { TMDBService } from '@/services/TMDBService';
import type { MoodBoard, TMDBImage } from '@/types/productionTools';
import styles from './MoodBoardPage.module.css';

const moodBoardRepo = new MoodBoardRepository();
const tmdbService = new TMDBService();

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
    try {
      const images = await tmdbService.getMovieImages(movieId);
      setMovieImages(images);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load images');
    }
  }, [setMovieImages]);

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

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  }, [handleSearch]);

  if (loading) {
    return <div className={styles.loading}>Loading mood boards…</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Mood Board</h1>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {/* TMDB Search Bar */}
        <div className={styles.searchBar}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search movies on TMDB…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <button
            className={styles.searchBtn}
            onClick={handleSearch}
            disabled={searching || !query.trim()}
          >
            {searching ? 'Searching…' : 'Search'}
          </button>
        </div>

        {/* Movie Result Grid */}
        {searchResults.length > 0 && !selectedMovieId && (
          <>
            <h2 className={styles.sectionTitle}>Movies</h2>
            <div className={styles.movieGrid}>
              {searchResults.map((movie) => (
                <div
                  key={movie.id}
                  className={styles.movieCard}
                  onClick={() => handleSelectMovie(movie.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSelectMovie(movie.id); }}
                >
                  {movie.posterPath ? (
                    <img
                      className={styles.moviePoster}
                      src={tmdbService.getImageUrl(movie.posterPath, 'w200')}
                      alt={movie.title}
                      loading="lazy"
                    />
                  ) : (
                    <div className={styles.noPoster}>No Poster</div>
                  )}
                  <div className={styles.movieInfo}>
                    <div className={styles.movieTitle}>{movie.title}</div>
                    <div className={styles.movieYear}>
                      {movie.releaseDate ? movie.releaseDate.slice(0, 4) : '—'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Movie Image Grid (stills + backdrops) */}
        {selectedMovieId && movieImages.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                Images
              </h2>
              <button
                className={styles.searchBtn}
                onClick={() => { setSelectedMovieId(null); setMovieImages([]); }}
                style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-1) var(--space-3)' }}
              >
                ← Back to results
              </button>
            </div>
            <div className={styles.imageGrid}>
              {movieImages.map((img, idx) => (
                <div key={`${img.filePath}-${idx}`} className={styles.imageCard}>
                  <img
                    className={styles.imageThumb}
                    src={tmdbService.getImageUrl(img.filePath, 'w500')}
                    alt={`${img.type} image`}
                    loading="lazy"
                    onClick={() => setLightboxImage(tmdbService.getImageUrl(img.filePath, 'original'))}
                  />
                  <div className={styles.imageOverlay}>
                    <span style={{ color: '#fff', fontSize: 'var(--text-xs)' }}>{img.type}</span>
                    {boards.length > 0 && (
                      <select
                        className={styles.saveBtn}
                        value=""
                        onChange={(e) => {
                          const board = boards.find((b) => b.id === e.target.value);
                          if (board) handleSaveImage(img, board);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        disabled={savingBoard !== null}
                      >
                        <option value="" disabled>Save to…</option>
                        {boards.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {selectedMovieId && movieImages.length === 0 && (
          <p style={{ color: 'var(--color-text-secondary)' }}>No images found for this movie.</p>
        )}
      </div>

      {/* Board Collection Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTitle}>My Boards</div>
        {boards.map((board) => (
          <Link
            key={board.id}
            to={`/moodboard/${board.id}`}
            className={styles.boardItem}
          >
            {board.name}
          </Link>
        ))}
        <div className={styles.newBoardRow}>
          <input
            className={styles.newBoardInput}
            type="text"
            placeholder="New board name"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateBoard(); }}
          />
          <button
            className={styles.newBoardBtn}
            onClick={handleCreateBoard}
            disabled={!newBoardName.trim()}
          >
            +
          </button>
        </div>
      </aside>

      {/* Image Lightbox */}
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
