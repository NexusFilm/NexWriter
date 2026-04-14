import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { filterByCategory } from '@/utils/categoryFilter';
import type { BlogPost } from '@/types/blog';

/**
 * Feature: draftkit-screenwriter
 * Property 13: Category Filter Returns Only Matching Posts
 *
 * For any list of BlogPost[] and selected category string, the filtered result
 * SHALL contain only posts whose category matches the selected category, and
 * SHALL contain all posts from the original list that match.
 *
 * **Validates: Requirements 13.2**
 */

const categoryArb = fc.constantFrom('craft', 'industry', 'formatting', 'storytelling', 'tools');

const isoDateArb = fc
  .integer({ min: 946684800000, max: 1893456000000 }) // 2000-01-01 to 2030-01-01
  .map((ts) => new Date(ts).toISOString());

const blogPostArb = (category?: string): fc.Arbitrary<BlogPost> =>
  fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    slug: fc.string({ minLength: 1, maxLength: 50 }),
    content: fc.string({ minLength: 0, maxLength: 200 }),
    author: fc.string({ minLength: 1, maxLength: 50 }),
    category: category ? fc.constant(category) : categoryArb,
    publishedAt: fc.option(isoDateArb, { nil: null }),
    readTimeMinutes: fc.option(fc.integer({ min: 1, max: 30 }), { nil: null }),
    createdAt: isoDateArb,
  });

const blogPostsArb = fc.array(blogPostArb(), { minLength: 0, maxLength: 30 });

describe('Property 13: Category Filter Returns Only Matching Posts', () => {
  it('filtered result contains only posts matching the selected category', () => {
    fc.assert(
      fc.property(blogPostsArb, categoryArb, (posts, category) => {
        const result = filterByCategory(posts, category);
        for (const post of result) {
          expect(post.category).toBe(category);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('filtered result contains all posts from the original list that match', () => {
    fc.assert(
      fc.property(blogPostsArb, categoryArb, (posts, category) => {
        const result = filterByCategory(posts, category);
        const expected = posts.filter((p) => p.category === category);
        expect(result).toHaveLength(expected.length);
        for (const post of expected) {
          expect(result).toContainEqual(post);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('null category returns all posts unchanged', () => {
    fc.assert(
      fc.property(blogPostsArb, (posts) => {
        const result = filterByCategory(posts, null);
        expect(result).toHaveLength(posts.length);
        expect(result).toEqual(posts);
      }),
      { numRuns: 100 },
    );
  });

  it('filtered result is a subset of the original posts', () => {
    fc.assert(
      fc.property(blogPostsArb, categoryArb, (posts, category) => {
        const result = filterByCategory(posts, category);
        expect(result.length).toBeLessThanOrEqual(posts.length);
        for (const post of result) {
          expect(posts).toContainEqual(post);
        }
      }),
      { numRuns: 100 },
    );
  });
});
