import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { canCreateScriptPure } from '@/services/TierGateService';
import type { Tier } from '@/types/subscription';

/**
 * Feature: draftkit-screenwriter
 * Property 6: Script Creation Tier Gating
 *
 * For any user tier and script count, canCreateScriptPure SHALL return true
 * if the tier is 'writer' or 'pro' (regardless of script count), true if
 * the tier is 'free' and script count < 3, and false if the tier is 'free'
 * and script count >= 3.
 *
 * **Validates: Requirements 3.2, 3.3, 3.4**
 */
describe('Property 6: Script Creation Tier Gating', () => {
  const tierArb = fc.constantFrom<Tier>('free', 'writer', 'pro');
  const scriptCountArb = fc.nat({ max: 100 });

  it('writer and pro tiers can always create scripts', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Tier>('writer', 'pro'),
        scriptCountArb,
        (tier, scriptCount) => {
          expect(canCreateScriptPure(tier, scriptCount)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('free tier with fewer than 3 scripts can create a script', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 2 }), // 0, 1, or 2
        (scriptCount) => {
          expect(canCreateScriptPure('free', scriptCount)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('free tier with 3 or more scripts cannot create a script', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 100 }),
        (scriptCount) => {
          expect(canCreateScriptPure('free', scriptCount)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('result matches tier rules for any random tier and script count', () => {
    fc.assert(
      fc.property(tierArb, scriptCountArb, (tier, scriptCount) => {
        const result = canCreateScriptPure(tier, scriptCount);

        if (tier === 'writer' || tier === 'pro') {
          expect(result).toBe(true);
        } else if (scriptCount < 3) {
          expect(result).toBe(true);
        } else {
          expect(result).toBe(false);
        }
      }),
      { numRuns: 200 },
    );
  });
});
