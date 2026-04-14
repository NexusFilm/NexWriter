import { supabase } from '@/lib/supabase';

import { AppError } from '@/types/errors';
import type { BlogPost } from '@/types/blog';
import type { IBlogRepository } from '@/types/repositories';

interface BlogPostRow {
  id: string;
  title: string;
  slug: string;
  content: string;
  author: string;
  category: string;
  published_at: string | null;
  read_time_minutes: number | null;
  created_at: string;
}

function mapBlogPost(row: BlogPostRow): BlogPost {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    author: row.author,
    category: row.category,
    publishedAt: row.published_at,
    readTimeMinutes: row.read_time_minutes,
    createdAt: row.created_at,
  };
}

export class BlogRepository implements IBlogRepository {
  async getPosts(category?: string): Promise<BlogPost[]> {
    let query = supabase
      .from('sw_blog_posts')
      .select('*')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError(
        error.message,
        'UNKNOWN_ERROR',
        'Unable to load blog posts. Please try again.',
        true,
      );
    }

    return (data as BlogPostRow[]).map(mapBlogPost);
  }

  async getPost(postId: string): Promise<BlogPost> {
    const { data, error } = await supabase
      .from('sw_blog_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error) {
      throw new AppError(
        error.message,
        'UNKNOWN_ERROR',
        'Blog post not found.',
      );
    }

    return mapBlogPost(data as BlogPostRow);
  }

  async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('sw_blog_posts')
      .select('category')
      .not('published_at', 'is', null);

    if (error) {
      throw new AppError(
        error.message,
        'UNKNOWN_ERROR',
        'Unable to load categories. Please try again.',
        true,
      );
    }

    const categories = new Set<string>();
    for (const row of data as { category: string }[]) {
      categories.add(row.category);
    }
    return Array.from(categories).sort();
  }
}
