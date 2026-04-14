import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { computePageCount } from '@/utils/pageCount';
import type { ScreenplayElement, ElementType } from '@/types/screenplay';

/**
 * Feature: draftkit-screenwriter
 * Property 17: Page Count Monotonicity
 *
 * For any ScreenplayElement[] of length N, the computed page count SHALL be >= 0,
 * and appending any additional valid ScreenplayElement SHALL result in a page count
 * >= the previous page count.
 *
 * **Validates: Requirements 6.3**
 */
describe('Property 17: Page Count Monotonicity', () => {
  const elementTypeArb: fc.Arbitrary<ElementType> = fc.constantFrom(
    'SCENE_HEADING' as const,
    'ACTION' as const,
    'CHARACTER' as const,
    'DIALOGUE' as const,
    'PARENTHETICAL' as const,
    'TRANSITION' as const,
    'TITLE_PAGE' as const,
  );

  const screenplayElementArb: fc.Arbitrary<ScreenplayElement> = fc.record({
    id: fc.uuid(),
    type: elementTypeArb,
    text: fc.string({ minLength: 0, maxLength: 200 }).filter(s => !s.includes('\0')),
    order: fc.nat({ max: 9999 }),
  });

  const screenplayElementsArb = fc
    .array(screenplayElementArb, { minLength: 0, maxLength: 50 })
    .map(els => els.map((el, i) => ({ ...el, order: i })));

  it('page count is always >= 0 for any elements', () => {
    fc.assert(
      fc.property(screenplayElementsArb, (elements) => {
        const count = computePageCount(elements);
        expect(count).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 },
    );
  });

  it('appending an element never decreases the page count', () => {
    fc.assert(
      fc.property(screenplayElementsArb, screenplayElementArb, (elements, extra) => {
        const countBefore = computePageCount(elements);
        const appended = [
          ...elements,
          { ...extra, order: elements.length },
        ];
        const countAfter = computePageCount(appended);
        expect(countAfter).toBeGreaterThanOrEqual(countBefore);
      }),
      { numRuns: 100 },
    );
  });
});
