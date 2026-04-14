import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Feature: draftkit-screenwriter
 * Property 4: localStorage Round-Trip
 *
 * For any valid ScreenplayElement[], saving to localStorage (JSON.stringify)
 * and reading back (JSON.parse) SHALL produce an array equivalent to the original.
 *
 * **Validates: Requirements 7.6**
 */
describe('Property 4: localStorage Round-Trip', () => {
  const elementTypeArb = fc.constantFrom(
    'SCENE_HEADING' as const,
    'ACTION' as const,
    'CHARACTER' as const,
    'DIALOGUE' as const,
    'PARENTHETICAL' as const,
    'TRANSITION' as const,
    'TITLE_PAGE' as const,
  );

  const screenplayElementArb = fc.record({
    id: fc.uuid(),
    type: elementTypeArb,
    text: fc.string({ minLength: 0, maxLength: 200 }).filter(s => !s.includes('\0')),
    order: fc.nat({ max: 9999 }),
  });

  const screenplayElementsArb = fc
    .array(screenplayElementArb, { minLength: 0, maxLength: 50 })
    .map(els => els.map((el, i) => ({ ...el, order: i })));

  it('JSON.parse(JSON.stringify(elements)) deep equals original', () => {
    fc.assert(
      fc.property(screenplayElementsArb, (elements) => {
        const serialized = JSON.stringify(elements);
        const deserialized = JSON.parse(serialized);
        expect(deserialized).toEqual(elements);
      }),
      { numRuns: 100 },
    );
  });
});
