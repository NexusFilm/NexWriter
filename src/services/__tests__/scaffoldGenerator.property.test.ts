import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateScaffold } from '@/services/ScaffoldGenerator';
import type { Beat } from '@/types/blueprint';

/**
 * Feature: draftkit-screenwriter, Property 14: Blueprint Scaffold Contains Beat Markers
 * Validates: Requirements 17.6, 19.1
 */

const beatArb: fc.Arbitrary<Beat> = fc.record({
  id: fc.uuid(),
  frameworkId: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => !s.includes('\0')),
  description: fc.string({ minLength: 0, maxLength: 100 }),
  beatOrder: fc.nat({ max: 20 }),
  pageRangeStart: fc.oneof(fc.constant(null), fc.nat({ max: 120 })),
  pageRangeEnd: fc.oneof(fc.constant(null), fc.nat({ max: 120 })),
});

const beatsArb = fc
  .array(beatArb, { minLength: 1, maxLength: 10 })
  .map((beats) => beats.map((b, i) => ({ ...b, beatOrder: i + 1 })));

describe('Property 14: Blueprint Scaffold Contains Beat Markers', () => {
  it('scaffold contains at least one SCENE_HEADING per answered beat', () => {
    fc.assert(
      fc.property(beatsArb, (beats) => {
        // Generate answers for all beats (non-empty)
        const answers: Record<string, string> = {};
        for (const beat of beats) {
          answers[beat.id] = `Answer for ${beat.name}`;
        }

        const scaffold = generateScaffold(answers, beats);
        const headings = scaffold.filter((el) => el.type === 'SCENE_HEADING');

        // Each answered beat should have at least one SCENE_HEADING
        expect(headings.length).toBeGreaterThanOrEqual(beats.length);

        // Each beat's name should appear in a heading
        for (const beat of beats) {
          const found = headings.some((h) =>
            h.text.includes(beat.name.toUpperCase()),
          );
          expect(found).toBe(true);
        }
      }),
      { numRuns: 150 },
    );
  });

  it('scaffold omits beats with empty or missing answers', () => {
    fc.assert(
      fc.property(beatsArb, (beats) => {
        // Only answer the first beat
        const answers: Record<string, string> = {};
        if (beats.length > 0) {
          answers[beats[0].id] = 'Some answer';
        }

        const scaffold = generateScaffold(answers, beats);
        const headings = scaffold.filter((el) => el.type === 'SCENE_HEADING');

        // Only 1 heading for the 1 answered beat
        expect(headings.length).toBe(1);
      }),
      { numRuns: 100 },
    );
  });
});
