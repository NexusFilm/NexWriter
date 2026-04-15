import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import { BlogRepository } from '@/repositories/BlogRepository';
import { calculateReadTime } from '@/services/ReadTimeCalculator';
import styles from './AdminBlogEditorPage.module.css';

const blogRepo = new BlogRepository();

export function AdminBlogEditorPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const isNew = !postId || postId === 'new';

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('');
  const [author, setAuthor] = useState('');
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [currentPostId, setCurrentPostId] = useState<string | undefined>(postId);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({ openOnClick: false }),
    ],
    content: '',
  });

  useEffect(() => {
    if (isNew || !postId) return;
    async function loadPost() {
      try {
        const post = await blogRepo.getPost(postId!);
        setTitle(post.title);
        setSlug(post.slug);
        setCategory(post.category);
        setAuthor(post.author);
        setPublishedAt(post.publishedAt);
        setCurrentPostId(post.id);
        editor?.commands.setContent(post.content || '');
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        setLoading(false);
      }
    }
    loadPost();
  }, [postId, isNew, editor]);

  const handleSave = useCallback(async () => {
    if (!editor) return;
    setSaving(true);
    setError(null);
    try {
      const content = editor.getHTML();
      const readTime = calculateReadTime(content);
      const post = await blogRepo.upsertPost({
        id: currentPostId && currentPostId !== 'new' ? currentPostId : undefined,
        title,
        slug,
        content,
        author,
        category,
        published_at: publishedAt,
        read_time_minutes: readTime,
      });
      setCurrentPostId(post.id);
      if (isNew) {
        navigate(`/admin/blog/${post.id}`, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post');
    } finally {
      setSaving(false);
    }
  }, [editor, currentPostId, title, slug, category, author, publishedAt, isNew, navigate]);

  const handlePublish = useCallback(async () => {
    if (!editor) return;
    setSaving(true);
    setError(null);
    try {
      const content = editor.getHTML();
      const readTime = calculateReadTime(content);
      const now = new Date().toISOString();
      const post = await blogRepo.upsertPost({
        id: currentPostId && currentPostId !== 'new' ? currentPostId : undefined,
        title,
        slug,
        content,
        author,
        category,
        published_at: now,
        read_time_minutes: readTime,
      });
      setPublishedAt(now);
      setCurrentPostId(post.id);
      if (isNew) {
        navigate(`/admin/blog/${post.id}`, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish post');
    } finally {
      setSaving(false);
    }
  }, [editor, currentPostId, title, slug, category, author, isNew, navigate]);

  const handleUnpublish = useCallback(async () => {
    if (!editor || !currentPostId) return;
    setSaving(true);
    setError(null);
    try {
      const content = editor.getHTML();
      const readTime = calculateReadTime(content);
      await blogRepo.upsertPost({
        id: currentPostId,
        title,
        slug,
        content,
        author,
        category,
        published_at: null,
        read_time_minutes: readTime,
      });
      setPublishedAt(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unpublish post');
    } finally {
      setSaving(false);
    }
  }, [editor, currentPostId, title, slug, category, author]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading post…</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link to="/admin/blog" className={styles.backLink}>
        ← Back to Blog Posts
      </Link>
      <h1 className={styles.title}>{isNew ? 'New Blog Post' : 'Edit Blog Post'}</h1>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.metaForm}>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="blog-title">Title</label>
          <input
            id="blog-title"
            className={styles.fieldInput}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="blog-slug">Slug</label>
          <input
            id="blog-slug"
            className={styles.fieldInput}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="blog-category">Category</label>
          <input
            id="blog-category"
            className={styles.fieldInput}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="blog-author">Author</label>
          <input
            id="blog-author"
            className={styles.fieldInput}
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.editorSection}>
        <div className={styles.editorLabel}>Content</div>
        {editor && (
          <div className={styles.toolbar}>
            <button
              type="button"
              className={editor.isActive('heading', { level: 2 }) ? styles.toolbarBtnActive : styles.toolbarBtn}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              H2
            </button>
            <button
              type="button"
              className={editor.isActive('heading', { level: 3 }) ? styles.toolbarBtnActive : styles.toolbarBtn}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              H3
            </button>
            <button
              type="button"
              className={editor.isActive('bold') ? styles.toolbarBtnActive : styles.toolbarBtn}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              B
            </button>
            <button
              type="button"
              className={editor.isActive('italic') ? styles.toolbarBtnActive : styles.toolbarBtn}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              I
            </button>
            <button
              type="button"
              className={editor.isActive('bulletList') ? styles.toolbarBtnActive : styles.toolbarBtn}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              • List
            </button>
            <button
              type="button"
              className={editor.isActive('orderedList') ? styles.toolbarBtnActive : styles.toolbarBtn}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              1. List
            </button>
            <button
              type="button"
              className={editor.isActive('link') ? styles.toolbarBtnActive : styles.toolbarBtn}
              onClick={() => {
                const url = window.prompt('Enter URL');
                if (url) {
                  editor.chain().focus().setLink({ href: url }).run();
                } else {
                  editor.chain().focus().unsetLink().run();
                }
              }}
            >
              Link
            </button>
          </div>
        )}
        <div className={styles.editorContent}>
          <EditorContent editor={editor} />
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={saving}
          type="button"
        >
          {saving ? 'Saving…' : 'Save Draft'}
        </button>
        {publishedAt ? (
          <button
            className={styles.unpublishBtn}
            onClick={handleUnpublish}
            disabled={saving}
            type="button"
          >
            Unpublish
          </button>
        ) : (
          <button
            className={styles.publishBtn}
            onClick={handlePublish}
            disabled={saving}
            type="button"
          >
            Publish
          </button>
        )}
      </div>
    </div>
  );
}
