import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { parseCharacters } from '@/services/CharacterParser';
import type { ElementType, ScreenplayElement } from '@/types/screenplay';

/**
 * Feature: draftkit-screenwriter, Property 9: Character Tracker Counts Are Consistent
 * Validates: Requirements 9.1
 */

const elementTypeArb: fc.Arbitrary<ElementType> = fc.constantFrom(
  'SCENE_HEADING',
  'ACTION',
  'CHARACTER',
  'DIALOGUE',
  'PARENTHETICAL',
  'TRANSITION',
  'TITLE_PAGE',
);

const screenplayElementArb: fc.Arbitrary<ScreenplayElement> = fc.record({
  id: fc.uuid(),
  type: elementTypeArb,
  text: fc.string({ minLength: 0, maxLength: 200 }).filter((s) => !s.includes('\0')),
  order: fc.nat({ max: 9999 }),
});

const screenplayElementsArb = fc
  .array(screenplayElementArb, { minLength: 0, maxLength: 50 })
  .map((els) => els.map((el, i) => ({ ...el, order: i })));

describe('Property 9: Character Tracker Counts Are Consistent', () => {
  it('should have sum of counts equal to total CHARACTER elements with non-empty trimmed names, and no duplicate names', () => {
    fc.assert(
      fc.property(screenplayElementsArb, (elements) => {
        const result = parseCharacters(elements);

        // Count CHARACTER elements with non-empty trimmed text (matching parser behavior)
        const characterElements = elements.filter(
          (el) => el.type === 'CHARACTER' && el.text.trim().length > 0,
        );

        // Sum of counts must equal total CHARACTER elements with non-empty names
        const totalCount = result.reduce((sum, c) => sum + c.count, 0);
        expect(totalCount).toBe(characterElements.length);

        // No duplicate names in output
        const names = result.map((c) => c.name);
        const uniqueNames = new Set(names);
        expect(uniqueNames.size).toBe(names.length);
      }),
      { numRuns: 150 },
    );
  });
});
