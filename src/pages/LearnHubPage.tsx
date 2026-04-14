import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BlogRepository } from '@/repositories/BlogRepository';
import { useAuthStore } from '@/stores/authStore';
import { filterByCategory } from '@/utils/categoryFilter';
import type { BlogPost } from '@/types/blog';
import styles from './LearnHubPage.module.css';

export { filterByCategory } from '@/utils/categoryFilter';

const blogRepo = new BlogRepository();

export function LearnHubPage() {
  const navigate = useNavigate();
  const tier = useAuthStore((s) => s.tier);

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [fetchedPosts, fetchedCategories] = await Promise.all([
          blogRepo.getPosts(),
          blogRepo.getCategories(),
        ]);
        setPosts(fetchedPosts);
        setCategories(fetchedCategories);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load posts');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleCategoryClick = useCallback((category: string | null) => {
    setSelectedCategory(category);
  }, []);

  const handlePostClick = useCallback(
    (postId: string) => {
      navigate(`/learn/${postId}`);
    },
    [navigate],
  );

  const filteredPosts = filterByCategory(posts, selectedCategory);
  const showAds = tier === 'free';

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading articles…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Learn</h1>
        <p className={styles.subtitle}>
          Articles and guides to sharpen your screenwriting craft
        </p>
      </header>

      <nav className={styles.filters} aria-label="Category filters">
        <button
          className={selectedCategory === null ? styles.filterBtnActive : styles.filterBtn}
          onClick={() => handleCategoryClick(null)}
          type="button"
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={selectedCategory === cat ? styles.filterBtnActive : styles.filterBtn}
            onClick={() => handleCategoryClick(cat)}
            type="button"
          >
            {cat}
          </button>
        ))}
      </nav>

      {filteredPosts.length === 0 ? (
        <div className={styles.empty}>No articles found.</div>
      ) : (
        <div className={styles.grid}>
          {showAds && (
            <div className={styles.adSlot} role="complementary" aria-label="Advertisement">
              Advertisement
            </div>
          )}
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              className={styles.card}
              onClick={() => handlePostClick(post.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handlePostClick(post.id);
                }
              }}
              tabIndex={0}
              role="link"
              aria-label={post.title}
            >
              <div className={styles.cardCategory}>{post.category}</div>
              <h2 className={styles.cardTitle}>{post.title}</h2>
              <div className={styles.cardMeta}>
                <span>{post.author}</span>
                {post.readTimeMinutes && <span>{post.readTimeMinutes} min read</span>}
              </div>
            </article>
          ))}
          {showAds && filteredPosts.length > 3 && (
            <div className={styles.adSlot} role="complementary" aria-label="Advertisement">
              Advertisement
            </div>
          )}
        </div>
      )}
    </div>
  );
}
