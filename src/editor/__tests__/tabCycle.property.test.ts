import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { cycleElementType, ELEMENT_TYPE_CYCLE } from '@/editor/KeyboardPlugin';

/**
 * Feature: draftkit-screenwriter
 * Property 5: Tab Cycles Element Types Completely
 *
 * For any ElementType, pressing Tab SHALL produce the next type in the cycle
 * (SCENE_HEADING → ACTION → CHARACTER → DIALOGUE → PARENTHETICAL → TRANSITION → SCENE_HEADING),
 * and applying the cycle function 6 times SHALL return to the original type.
 *
 * **Validates: Requirements 5.1**
 */
describe('Property 5: Tab Cycles Element Types Completely', () => {
  const cycleTypeArb = fc.constantFrom(...ELEMENT_TYPE_CYCLE);

  it('cycleElementType produces the correct next type in the cycle', () => {
    fc.assert(
      fc.property(cycleTypeArb, (elementType) => {
        const idx = ELEMENT_TYPE_CYCLE.indexOf(elementType);
        const expectedNext = ELEMENT_TYPE_CYCLE[(idx + 1) % ELEMENT_TYPE_CYCLE.length];
        const actual = cycleElementType(elementType);
        expect(actual).toBe(expectedNext);
      }),
      { numRuns: 100 },
    );
  });

  it('applying cycleElementType 6 times returns to the original type', () => {
    fc.assert(
      fc.property(cycleTypeArb, (elementType) => {
        let current = elementType;
        for (let i = 0; i < ELEMENT_TYPE_CYCLE.length; i++) {
          current = cycleElementType(current);
        }
        expect(current).toBe(elementType);
      }),
      { numRuns: 100 },
    );
  });
});
