import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { toggleAnnotationsPreservesElements } from '@/editor/BlueprintAnnotations';
import type { ElementType, ScreenplayElement } from '@/types/screenplay';

/**
 * Feature: draftkit-screenwriter, Property 15: Annotation Toggle Preserves Elements
 * Validates: Requirements 19.4
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

describe('Property 15: Annotation Toggle Preserves Elements', () => {
  it('toggling annotations off preserves elements array', () => {
    fc.assert(
      fc.property(screenplayElementsArb, (elements) => {
        const result = toggleAnnotationsPreservesElements(elements, false);
        expect(result).toEqual(elements);
        expect(result.length).toBe(elements.length);
      }),
      { numRuns: 150 },
    );
  });

  it('toggling annotations on also preserves elements array', () => {
    fc.assert(
      fc.property(screenplayElementsArb, (elements) => {
        const result = toggleAnnotationsPreservesElements(elements, true);
        expect(result).toEqual(elements);
      }),
      { numRuns: 100 },
    );
  });
});
