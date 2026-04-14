import type { BlogPost } from '@/types/blog';

/**
 * Pure function: filters blog posts by category.
 * If category is null or empty, returns all posts.
 */
export function filterByCategory(posts: BlogPost[], category: string | null): BlogPost[] {
  if (!category) {
    return posts;
  }
  return posts.filter((post) => post.category === category);
}
