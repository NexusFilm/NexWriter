import type { ScreenplayElement } from '@/types/screenplay';

export interface ParsedScene {
  index: number;
  text: string;
  elementId: string;
}

/**
 * Parses SCENE_HEADING elements from a screenplay, returning them
 * in original order with 1-based index numbering.
 */
export function parseScenes(elements: ScreenplayElement[]): ParsedScene[] {
  let idx = 0;
  return elements
    .filter((el) => el.type === 'SCENE_HEADING')
    .map((el) => ({
      index: ++idx,
      text: el.text,
      elementId: el.id,
    }));
}
