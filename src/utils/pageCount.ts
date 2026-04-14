import type { ScreenplayElement, ElementType } from '@/types/screenplay';

/**
 * Compute the page count from ScreenplayElement[] using standard screenplay layout rules.
 *
 * Layout assumptions (Courier 12pt, US Letter):
 *   - Page: 8.5" × 11"
 *   - Margins: 1.5" left, 1" top/right/bottom
 *   - Usable width: 6" → 60 chars/line (10 chars/inch)
 *   - Usable height: 9" → 54 lines/page (6 lines/inch)
 *   - DIALOGUE uses a narrower column (~35 chars) due to indentation
 */

const LINES_PER_PAGE = 54;
const ACTION_WIDTH = 60;
const DIALOGUE_WIDTH = 35;

function linesForElement(el: ScreenplayElement): number {
  const text = el.text;

  switch (el.type as ElementType) {
    case 'TITLE_PAGE':
      // Title page occupies a full page; handled separately
      return 0;
    case 'SCENE_HEADING':
      // 1 line + 1 blank line before
      return 2;
    case 'TRANSITION':
      // 1 line + 1 blank line before
      return 2;
    case 'CHARACTER':
      return 1;
    case 'PARENTHETICAL':
      return 1;
    case 'DIALOGUE':
      return text.length > 0 ? Math.ceil(text.length / DIALOGUE_WIDTH) : 1;
    case 'ACTION':
      return text.length > 0 ? Math.ceil(text.length / ACTION_WIDTH) : 1;
    default:
      return text.length > 0 ? Math.ceil(text.length / ACTION_WIDTH) : 1;
  }
}

export function computePageCount(elements: ScreenplayElement[]): number {
  if (elements.length === 0) return 0;

  const hasTitlePage = elements.some((el) => el.type === 'TITLE_PAGE');

  const nonTitleElements = elements.filter((el) => el.type !== 'TITLE_PAGE');

  const totalLines = nonTitleElements.reduce(
    (sum, el) => sum + linesForElement(el),
    0,
  );

  const contentPages = totalLines > 0 ? Math.ceil(totalLines / LINES_PER_PAGE) : 0;

  const pages = contentPages + (hasTitlePage ? 1 : 0);

  return Math.max(1, pages);
}
