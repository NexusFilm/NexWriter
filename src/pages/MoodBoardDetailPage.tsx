import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useMoodBoardStore } from '@/stores/moodBoardStore';
import { MoodBoardRepository } from '@/repositories/MoodBoardRepository';
import { TMDBService } from '@/services/TMDBService';
import type { MoodBoardImage } from '@/types/productionTools';
import styles from './MoodBoardDetailPage.module.css';

const moodBoardRepo = new MoodBoardRepository();
const tmdbService = new TMDBService();

export function MoodBoardDetailPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const user = useAuthStore((s) => s.user);

  const currentBoard = useMoodBoardStore((s) => s.currentBoard);
  const images = useMoodBoardStore((s) => s.images);
  const setCurrentBoard = useMoodBoardStore((s) => s.setCurrentBoard);
  const setImages = useMoodBoardStore((s) => s.setImages);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load board and images on mount
  useEffect(() => {
    if (!user || !boardId) return;
    let cancelled = false;

    async function load() {
      try {
        const boards = await moodBoardRepo.getBoards(user!.id);
        const board = boards.find((b) => b.id === boardId) ?? null;
        if (!cancelled) {
          setCurrentBoard(board);
          if (board) {
            const imgs = await moodBoardRepo.getImages(board.id);
            if (!cancelled) setImages(imgs);
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load board');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user, boardId, setCurrentBoard, setImages]);

  const handleUpdateImage = useCallback(
    async (imageId: string, updates: Partial<MoodBoardImage>) => {
      // Optimistic update
      setImages(images.map((img) => (img.id === imageId ? { ...img, ...updates } : img)));
      try {
        await moodBoardRepo.updateImage(imageId, updates);
      } catch {
        // Silently fail on persist error — optimistic update stays
      }
    },
    [images, setImages],
  );

  const handleDeleteImage = useCallback(
    async (imageId: string) => {
      setImages(images.filter((img) => img.id !== imageId));
      try {
        await moodBoardRepo.deleteImage(imageId);
      } catch {
        // Image already removed from UI
      }
    },
    [images, setImages],
  );

  if (loading) {
    return <div className={styles.loading}>Loading board…</div>;
  }

  if (!currentBoard) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <Link to="/moodboard" className={styles.backLink}>← Back to Mood Boards</Link>
        </div>
        <div className={styles.empty}>
          <p>Board not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link to="/moodboard" className={styles.backLink}>← Back to Mood Boards</Link>
        <h1 className={styles.title}>{currentBoard.name}</h1>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {images.length === 0 ? (
        <div className={styles.empty}>
          <p>No images saved yet. Search for movies on the Mood Board page to add images.</p>
        </div>
      ) : (
        <div className={styles.imageGrid}>
          {images.map((img) => (
            <div key={img.id} className={styles.imageCard}>
              <img
                className={styles.imageThumb}
                src={tmdbService.getImageUrl(img.tmdbImagePath, 'w500')}
                alt="Saved reference"
                loading="lazy"
              />
              <button
                className={styles.deleteBtn}
                onClick={() => handleDeleteImage(img.id)}
                aria-label="Delete image"
              >
                ✕
              </button>
              <div className={styles.imageHover}>
                <textarea
                  className={styles.noteInput}
                  placeholder="Add a note…"
                  value={img.note}
                  rows={2}
                  onChange={(e) => handleUpdateImage(img.id, { note: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                />
                <input
                  className={styles.tagsInput}
                  type="text"
                  placeholder="Tags (comma-separated)"
                  value={img.tags}
                  onChange={(e) => handleUpdateImage(img.id, { tags: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
