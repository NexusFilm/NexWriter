import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { duplicateTitle } from '@/utils/duplicateTitle';

/**
 * Feature: draftkit-screenwriter
 * Property 16: Duplicate Title Transformation
 *
 * For any title string, duplicating a script SHALL produce a title
 * equal to the original title + " (Copy)".
 *
 * **Validates: Requirements 2.4**
 */
describe('Property 16: Duplicate Title Transformation', () => {
  const titleArb = fc.string({ minLength: 0, maxLength: 200 });

  it('duplicateTitle(title) === title + " (Copy)"', () => {
    fc.assert(
      fc.property(titleArb, (title) => {
        expect(duplicateTitle(title)).toBe(title + ' (Copy)');
      }),
      { numRuns: 100 },
    );
  });

  it('result always ends with " (Copy)"', () => {
    fc.assert(
      fc.property(titleArb, (title) => {
        expect(duplicateTitle(title).endsWith(' (Copy)')).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('result.length === title.length + 7', () => {
    fc.assert(
      fc.property(titleArb, (title) => {
        expect(duplicateTitle(title).length).toBe(title.length + 7);
      }),
      { numRuns: 100 },
    );
  });
});
