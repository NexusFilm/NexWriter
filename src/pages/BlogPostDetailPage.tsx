import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BlogRepository } from '@/repositories/BlogRepository';
import type { BlogPost } from '@/types/blog';
import styles from './BlogPostDetailPage.module.css';

const blogRepo = new BlogRepository();

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function BlogPostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;
    async function load() {
      try {
        const data = await blogRepo.getPost(postId!);
        setPost(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [postId]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading article…</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>{error ?? 'Post not found'}</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <button className={styles.backLink} onClick={() => navigate('/learn')} type="button">
        ← Back to Learn
      </button>
      <article className={styles.article}>
        <div className={styles.category}>{post.category}</div>
        <h1 className={styles.title}>{post.title}</h1>
        <div className={styles.meta}>
          <span>{post.author}</span>
          {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
          {post.readTimeMinutes && <span>{post.readTimeMinutes} min read</span>}
        </div>
        <div className={styles.content}>{post.content}</div>
      </article>
    </div>
  );
}
