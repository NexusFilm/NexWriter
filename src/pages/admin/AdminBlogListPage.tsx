import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BlogRepository } from '@/repositories/BlogRepository';
import type { BlogPost } from '@/types/blog';
import styles from './AdminBlogListPage.module.css';

const blogRepo = new BlogRepository();

export function AdminBlogListPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPosts() {
      try {
        const data = await blogRepo.getAllPosts();
        setPosts(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load posts');
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Blog Posts</h1>
        <button
          className={styles.newBtn}
          onClick={() => navigate('/admin/blog/new')}
          type="button"
        >
          + New Post
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Loading posts…</div>
      ) : posts.length === 0 ? (
        <div className={styles.empty}>No blog posts yet. Create your first one.</div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td>
                  <span
                    className={styles.titleLink}
                    onClick={() => navigate(`/admin/blog/${post.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') navigate(`/admin/blog/${post.id}`);
                    }}
                    role="link"
                    tabIndex={0}
                  >
                    {post.title}
                  </span>
                </td>
                <td>{post.category}</td>
                <td>
                  {post.publishedAt ? (
                    <span className={styles.published}>Published</span>
                  ) : (
                    <span className={styles.draft}>Draft</span>
                  )}
                </td>
                <td>{new Date(post.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
