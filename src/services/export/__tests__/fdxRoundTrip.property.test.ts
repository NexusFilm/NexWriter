import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { exportFDX, parseFDX } from '../fdxExport';

/**
 * Feature: draftkit-screenwriter
 * Property 3: FDX Export Round-Trip
 *
 * For any valid ScreenplayElement[] with XML-safe text,
 * exporting to FDX format via exportFDX and then parsing back
 * via parseFDX SHALL produce an array equivalent to the original.
 *
 * **Validates: Requirements 12.7**
 */
describe('Property 3: FDX Export Round-Trip', () => {
  const elementTypeArb = fc.constantFrom(
    'SCENE_HEADING' as const,
    'ACTION' as const,
    'CHARACTER' as const,
    'DIALOGUE' as const,
    'PARENTHETICAL' as const,
    'TRANSITION' as const,
    'TITLE_PAGE' as const,
  );

  // Generate XML-safe text: no null bytes, no control chars, no XML-breaking sequences
  const xmlSafeTextArb = fc
    .string({ minLength: 0, maxLength: 200 })
    .filter(s =>
      !s.includes('\0') &&
      !s.includes('\x0B') &&
      !s.includes('\x0C') &&
      !/[\x00-\x08\x0E-\x1F]/.test(s)
    );

  const screenplayElementArb = fc.record({
    id: fc.uuid(),
    type: elementTypeArb,
    text: xmlSafeTextArb,
    order: fc.nat({ max: 9999 }),
  });

  const screenplayElementsArb = fc
    .array(screenplayElementArb, { minLength: 0, maxLength: 50 })
    .map(els => els.map((el, i) => ({ ...el, order: i })));

  it('elements → FDX → elements produces equivalent array', () => {
    fc.assert(
      fc.property(screenplayElementsArb, (elements) => {
        const fdx = exportFDX(elements);
        const result = parseFDX(fdx);
        expect(result).toEqual(elements);
      }),
      { numRuns: 100 },
    );
  });
});
