export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  author: string;
  category: string;
  publishedAt: string | null;
  readTimeMinutes: number | null;
  createdAt: string;
}
