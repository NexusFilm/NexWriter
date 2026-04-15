/**
 * Pure function: strips HTML tags, counts words, divides by 200 wpm, rounds up.
 * Returns a minimum of 1 minute.
 */
export function calculateReadTime(htmlContent: string): number {
  const text = htmlContent.replace(/<[^>]*>/g, '');
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}
