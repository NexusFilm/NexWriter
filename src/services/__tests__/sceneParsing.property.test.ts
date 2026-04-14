import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { parseScenes } from '@/services/SceneParser';
import type { ElementType, ScreenplayElement } from '@/types/screenplay';

/**
 * Feature: draftkit-screenwriter, Property 8: Scene Parsing Extracts Exactly Scene Headings
 * Validates: Requirements 8.1
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

describe('Property 8: Scene Parsing Extracts Exactly Scene Headings', () => {
  it('should return exactly the SCENE_HEADING elements in original order with 1-based indexing', () => {
    fc.assert(
      fc.property(screenplayElementsArb, (elements) => {
        const scenes = parseScenes(elements);
        const headings = elements.filter((el) => el.type === 'SCENE_HEADING');

        // Count must match
        expect(scenes.length).toBe(headings.length);

        // Each scene must correspond to the correct heading in order
        scenes.forEach((scene, i) => {
          expect(scene.index).toBe(i + 1);
          expect(scene.text).toBe(headings[i].text);
          expect(scene.elementId).toBe(headings[i].id);
        });
      }),
      { numRuns: 150 },
    );
  });
});
