import type { ScreenplayElement } from '@/types/screenplay';

export interface ParsedCharacter {
  name: string;
  count: number;
  firstElementId: string;
}

/**
 * Parses CHARACTER elements from a screenplay, deduplicates by name (text),
 * counts occurrences, and returns the first element ID for each unique character.
 */
export function parseCharacters(elements: ScreenplayElement[]): ParsedCharacter[] {
  const map = new Map<string, { count: number; firstElementId: string }>();

  for (const el of elements) {
    if (el.type !== 'CHARACTER') continue;

    const name = el.text.trim();
    if (!name) continue;

    const existing = map.get(name);
    if (existing) {
      existing.count++;
    } else {
      map.set(name, { count: 1, firstElementId: el.id });
    }
  }

  return Array.from(map.entries()).map(([name, data]) => ({
    name,
    count: data.count,
    firstElementId: data.firstElementId,
  }));
}
