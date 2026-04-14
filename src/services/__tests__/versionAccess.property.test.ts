import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getAccessibleVersions } from '@/pages/VersionHistoryPage';
import type { ScriptVersion } from '@/types/screenplay';
import type { Tier } from '@/types/subscription';

/**
 * Feature: draftkit-screenwriter, Property 7: Version Access Tier Gating
 * Validates: Requirements 11.4, 11.5
 */

const scriptVersionArb: fc.Arbitrary<ScriptVersion> = fc.record({
  id: fc.uuid(),
  scriptId: fc.uuid(),
  elements: fc.constant([]),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }).map(
    (d) => d.toISOString(),
  ),
});

const scriptVersionsArb = fc.array(scriptVersionArb, { minLength: 0, maxLength: 30 });

const tierArb: fc.Arbitrary<Tier> = fc.constantFrom('free', 'writer', 'pro');

describe('Property 7: Version Access Tier Gating', () => {
  it('should limit free tier to max 5 most recent versions, and show all for paid tiers', () => {
    fc.assert(
      fc.property(scriptVersionsArb, tierArb, (versions, tier) => {
        const result = getAccessibleVersions(versions, tier);

        if (tier === 'writer' || tier === 'pro') {
          // Paid tiers see all versions
          expect(result.length).toBe(versions.length);
          // All version IDs should be present
          const resultIds = new Set(result.map((v) => v.id));
          for (const v of versions) {
            expect(resultIds.has(v.id)).toBe(true);
          }
        } else {
          // Free tier: max 5 most recent
          expect(result.length).toBeLessThanOrEqual(5);
          expect(result.length).toBe(Math.min(versions.length, 5));

          // Verify they are the most recent ones
          const sorted = [...versions].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          const expected = sorted.slice(0, 5);
          const resultIds = new Set(result.map((v) => v.id));
          for (const v of expected) {
            expect(resultIds.has(v.id)).toBe(true);
          }
        }
      }),
      { numRuns: 150 },
    );
  });
});
