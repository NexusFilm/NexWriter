import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { resolveConflictPure } from '@/services/AutosaveManager';

/**
 * Feature: draftkit-screenwriter
 * Property 10: Conflict Resolution Picks Newer Version
 *
 * For any two (elements, timestamp) pairs representing a local draft and a cloud version,
 * the conflict resolver SHALL return the elements associated with the strictly greater timestamp.
 * If timestamps are equal, the cloud version SHALL be preferred.
 *
 * **Validates: Requirements 7.4**
 */
describe('Property 10: Conflict Resolution Picks Newer Version', () => {
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

  const timestampArb = fc.nat({ max: 2_000_000_000_000 });

  it('when localTimestamp > cloudTimestamp → returns localElements', () => {
    fc.assert(
      fc.property(
        screenplayElementsArb,
        screenplayElementsArb,
        timestampArb,
        timestampArb.filter(t => t > 0),
        (localElements, cloudElements, baseTimestamp, offset) => {
          const cloudTimestamp = baseTimestamp;
          const localTimestamp = baseTimestamp + offset;

          const result = resolveConflictPure(
            localElements,
            localTimestamp,
            cloudElements,
            cloudTimestamp,
          );

          expect(result).toBe(localElements);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('when cloudTimestamp > localTimestamp → returns cloudElements', () => {
    fc.assert(
      fc.property(
        screenplayElementsArb,
        screenplayElementsArb,
        timestampArb,
        timestampArb.filter(t => t > 0),
        (localElements, cloudElements, baseTimestamp, offset) => {
          const localTimestamp = baseTimestamp;
          const cloudTimestamp = baseTimestamp + offset;

          const result = resolveConflictPure(
            localElements,
            localTimestamp,
            cloudElements,
            cloudTimestamp,
          );

          expect(result).toBe(cloudElements);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('when timestamps are equal → returns cloudElements (cloud preferred)', () => {
    fc.assert(
      fc.property(
        screenplayElementsArb,
        screenplayElementsArb,
        timestampArb,
        (localElements, cloudElements, timestamp) => {
          const result = resolveConflictPure(
            localElements,
            timestamp,
            cloudElements,
            timestamp,
          );

          expect(result).toBe(cloudElements);
        },
      ),
      { numRuns: 100 },
    );
  });
});
