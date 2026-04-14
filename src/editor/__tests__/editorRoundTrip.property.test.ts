import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  editorStateToElements,
  elementsToEditorState,
} from '@/editor/serialization';

/**
 * Feature: draftkit-screenwriter
 * Property 1: Editor State Round-Trip
 *
 * For any valid ScreenplayElement[], converting to a ProseMirror document
 * via elementsToEditorState and then back via editorStateToElements
 * SHALL produce an array equivalent to the original.
 *
 * **Validates: Requirements 4.10**
 */
describe('Property 1: Editor State Round-Trip', () => {
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

  it('elements → doc → elements produces equivalent array', () => {
    fc.assert(
      fc.property(screenplayElementsArb, (elements) => {
        const doc = elementsToEditorState(elements);
        const result = editorStateToElements(doc);
        expect(result).toEqual(elements);
      }),
      { numRuns: 100 },
    );
  });
});
