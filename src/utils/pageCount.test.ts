import { describe, it, expect } from 'vitest';
import { computePageCount } from './pageCount';
import type { ScreenplayElement } from '@/types/screenplay';

function el(
  type: ScreenplayElement['type'],
  text = '',
  order = 0,
): ScreenplayElement {
  return { id: `id-${order}`, type, text, order };
}

describe('computePageCount', () => {
  it('returns 0 for an empty array', () => {
    expect(computePageCount([])).toBe(0);
  });

  it('returns at least 1 for any non-empty array', () => {
    expect(computePageCount([el('ACTION', 'Hello')])).toBe(1);
  });

  it('counts a TITLE_PAGE as a full page', () => {
    const elements = [el('TITLE_PAGE', 'My Movie', 0)];
    expect(computePageCount(elements)).toBe(1);
  });

  it('adds 1 page for TITLE_PAGE plus content pages', () => {
    const elements: ScreenplayElement[] = [
      el('TITLE_PAGE', 'My Movie', 0),
      el('ACTION', 'Some action.', 1),
    ];
    // 1 title page + 1 content page (1 line of action fits on one page)
    expect(computePageCount(elements)).toBe(2);
  });

  it('computes SCENE_HEADING as 2 lines (1 blank + 1 text)', () => {
    // 27 scene headings × 2 lines = 54 lines = 1 page
    const elements = Array.from({ length: 27 }, (_, i) =>
      el('SCENE_HEADING', `INT. ROOM ${i}`, i),
    );
    expect(computePageCount(elements)).toBe(1);

    // 28 scene headings × 2 lines = 56 lines → 2 pages
    const elements2 = Array.from({ length: 28 }, (_, i) =>
      el('SCENE_HEADING', `INT. ROOM ${i}`, i),
    );
    expect(computePageCount(elements2)).toBe(2);
  });

  it('computes ACTION lines based on text length / 60', () => {
    // 60 chars = 1 line
    const action60 = el('ACTION', 'a'.repeat(60));
    expect(computePageCount([action60])).toBe(1);

    // 61 chars = 2 lines
    const action61 = el('ACTION', 'a'.repeat(61));
    expect(computePageCount([action61])).toBe(1);
  });

  it('computes DIALOGUE lines based on text length / 35', () => {
    // 35 chars = 1 line
    const d35 = el('DIALOGUE', 'a'.repeat(35));
    expect(computePageCount([d35])).toBe(1);

    // 36 chars = 2 lines
    const d36 = el('DIALOGUE', 'a'.repeat(36));
    expect(computePageCount([d36])).toBe(1);

    // 70 chars = 2 lines
    const d70 = el('DIALOGUE', 'a'.repeat(70));
    expect(computePageCount([d70])).toBe(1);
  });

  it('computes CHARACTER as 1 line', () => {
    // 54 CHARACTER elements = 54 lines = 1 page
    const elements = Array.from({ length: 54 }, (_, i) =>
      el('CHARACTER', `CHAR ${i}`, i),
    );
    expect(computePageCount(elements)).toBe(1);

    // 55 CHARACTER elements = 55 lines → 2 pages
    const elements2 = Array.from({ length: 55 }, (_, i) =>
      el('CHARACTER', `CHAR ${i}`, i),
    );
    expect(computePageCount(elements2)).toBe(2);
  });

  it('computes PARENTHETICAL as 1 line', () => {
    const elements = Array.from({ length: 54 }, (_, i) =>
      el('PARENTHETICAL', '(beat)', i),
    );
    expect(computePageCount(elements)).toBe(1);
  });

  it('computes TRANSITION as 2 lines (1 blank + 1 text)', () => {
    // 27 transitions × 2 lines = 54 lines = 1 page
    const elements = Array.from({ length: 27 }, (_, i) =>
      el('TRANSITION', 'CUT TO:', i),
    );
    expect(computePageCount(elements)).toBe(1);
  });

  it('handles empty text for ACTION as 1 line', () => {
    expect(computePageCount([el('ACTION', '')])).toBe(1);
  });

  it('handles empty text for DIALOGUE as 1 line', () => {
    expect(computePageCount([el('DIALOGUE', '')])).toBe(1);
  });

  it('handles a realistic screenplay snippet', () => {
    const elements: ScreenplayElement[] = [
      el('SCENE_HEADING', 'INT. OFFICE - DAY', 0),       // 2 lines
      el('ACTION', 'A dimly lit room.', 1),                // 1 line
      el('CHARACTER', 'JOHN', 2),                          // 1 line
      el('DIALOGUE', 'Hello there.', 3),                   // 1 line
      el('PARENTHETICAL', '(smiling)', 4),                 // 1 line
      el('DIALOGUE', 'How are you?', 5),                   // 1 line
      el('TRANSITION', 'CUT TO:', 6),                      // 2 lines
      el('SCENE_HEADING', 'EXT. PARK - NIGHT', 7),        // 2 lines
      el('ACTION', 'Trees sway in the wind.', 8),          // 1 line
    ];
    // Total: 2+1+1+1+1+1+2+2+1 = 12 lines → 1 page
    expect(computePageCount(elements)).toBe(1);
  });

  it('correctly pages a large script', () => {
    // Fill exactly 2 pages with ACTION elements: 108 lines → 54 * 2
    const elements = Array.from({ length: 108 }, (_, i) =>
      el('ACTION', 'Short.', i),
    );
    expect(computePageCount(elements)).toBe(2);
  });
});
