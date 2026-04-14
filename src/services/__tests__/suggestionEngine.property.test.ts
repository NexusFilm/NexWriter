import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { filterPrompts, filterFallbackPrompts } from '@/services/SuggestionEngine';
import type { BeatPrompt } from '@/types/blueprint';

/**
 * Feature: draftkit-screenwriter, Property 11: Suggestion Engine Returns Matching Prompts
 * Validates: Requirements 16.3, 17.3, 17.4, 20.2
 */

const beatPromptArb: fc.Arbitrary<BeatPrompt> = fc.record({
  id: fc.uuid(),
  frameworkId: fc.constantFrom('fw-1', 'fw-2', 'fw-3'),
  beatId: fc.constantFrom('beat-1', 'beat-2', 'beat-3'),
  genre: fc.oneof(fc.constant(null), fc.constantFrom('Drama', 'Comedy', 'Thriller')),
  storyType: fc.oneof(fc.constant(null), fc.constantFrom('Feature', 'Short', 'Pilot')),
  promptText: fc.string({ minLength: 1, maxLength: 100 }),
  sortOrder: fc.nat({ max: 99 }),
});

const promptsArb = fc.array(beatPromptArb, { minLength: 0, maxLength: 30 });

describe('Property 11: Suggestion Engine Returns Matching Prompts', () => {
  it('all returned prompts have matching framework_id and beat_id, and matching or NULL genre/story_type', () => {
    fc.assert(
      fc.property(
        promptsArb,
        fc.constantFrom('fw-1', 'fw-2', 'fw-3'),
        fc.constantFrom('beat-1', 'beat-2', 'beat-3'),
        fc.constantFrom('Drama', 'Comedy', 'Thriller'),
        fc.constantFrom('Feature', 'Short', 'Pilot'),
        (prompts, frameworkId, beatId, genre, storyType) => {
          const result = filterPrompts(prompts, frameworkId, beatId, genre, storyType);

          for (const p of result) {
            expect(p.frameworkId).toBe(frameworkId);
            expect(p.beatId).toBe(beatId);
            expect(p.genre === genre || p.genre === null).toBe(true);
            expect(p.storyType === storyType || p.storyType === null).toBe(true);
          }
        },
      ),
      { numRuns: 150 },
    );
  });
});

/**
 * Feature: draftkit-screenwriter, Property 12: Suggestion Engine Fallback Returns Universal Prompts
 * Validates: Requirements 20.3
 */

describe('Property 12: Suggestion Engine Fallback Returns Universal Prompts', () => {
  it('fallback returns prompts with NULL genre and NULL story_type', () => {
    fc.assert(
      fc.property(
        promptsArb,
        fc.constantFrom('fw-1', 'fw-2', 'fw-3'),
        fc.constantFrom('beat-1', 'beat-2', 'beat-3'),
        (prompts, frameworkId, beatId) => {
          const result = filterFallbackPrompts(prompts, frameworkId, beatId);

          for (const p of result) {
            expect(p.frameworkId).toBe(frameworkId);
            expect(p.beatId).toBe(beatId);
            expect(p.genre).toBeNull();
            expect(p.storyType).toBeNull();
          }
        },
      ),
      { numRuns: 150 },
    );
  });
});
