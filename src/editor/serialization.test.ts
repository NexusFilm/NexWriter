import { describe, it, expect } from 'vitest';
import {
  editorStateToElements,
  elementsToEditorState,
  type TipTapDocJSON,
} from './serialization';
import type { ScreenplayElement } from '../types/screenplay';

describe('editorStateToElements', () => {
  it('returns empty array for doc with no content', () => {
    const doc: TipTapDocJSON = { type: 'doc' };
    expect(editorStateToElements(doc)).toEqual([]);
  });

  it('returns empty array for doc with empty content array', () => {
    const doc: TipTapDocJSON = { type: 'doc', content: [] };
    expect(editorStateToElements(doc)).toEqual([]);
  });

  it('extracts a single element with text', () => {
    const doc: TipTapDocJSON = {
      type: 'doc',
      content: [
        {
          type: 'screenplayBlock',
          attrs: { elementType: 'ACTION', elementId: 'a1', order: 0 },
          content: [{ type: 'text', text: 'John enters the room.' }],
        },
      ],
    };

    expect(editorStateToElements(doc)).toEqual([
      { id: 'a1', type: 'ACTION', text: 'John enters the room.', order: 0 },
    ]);
  });

  it('extracts multiple elements preserving order', () => {
    const doc: TipTapDocJSON = {
      type: 'doc',
      content: [
        {
          type: 'screenplayBlock',
          attrs: { elementType: 'SCENE_HEADING', elementId: 's1', order: 0 },
          content: [{ type: 'text', text: 'INT. OFFICE - DAY' }],
        },
        {
          type: 'screenplayBlock',
          attrs: { elementType: 'CHARACTER', elementId: 'c1', order: 1 },
          content: [{ type: 'text', text: 'JOHN' }],
        },
        {
          type: 'screenplayBlock',
          attrs: { elementType: 'DIALOGUE', elementId: 'd1', order: 2 },
          content: [{ type: 'text', text: 'Hello, world.' }],
        },
      ],
    };

    const elements = editorStateToElements(doc);
    expect(elements).toHaveLength(3);
    expect(elements[0]).toEqual({ id: 's1', type: 'SCENE_HEADING', text: 'INT. OFFICE - DAY', order: 0 });
    expect(elements[1]).toEqual({ id: 'c1', type: 'CHARACTER', text: 'JOHN', order: 1 });
    expect(elements[2]).toEqual({ id: 'd1', type: 'DIALOGUE', text: 'Hello, world.', order: 2 });
  });

  it('handles blocks with no text content', () => {
    const doc: TipTapDocJSON = {
      type: 'doc',
      content: [
        {
          type: 'screenplayBlock',
          attrs: { elementType: 'ACTION', elementId: 'a1', order: 0 },
        },
      ],
    };

    expect(editorStateToElements(doc)).toEqual([
      { id: 'a1', type: 'ACTION', text: '', order: 0 },
    ]);
  });

  it('defaults elementType to ACTION when attrs missing', () => {
    const doc: TipTapDocJSON = {
      type: 'doc',
      content: [
        {
          type: 'screenplayBlock',
          content: [{ type: 'text', text: 'Some text' }],
        },
      ],
    };

    const elements = editorStateToElements(doc);
    expect(elements[0].type).toBe('ACTION');
  });
});

describe('elementsToEditorState', () => {
  it('returns empty doc for empty array', () => {
    const doc = elementsToEditorState([]);
    expect(doc).toEqual({ type: 'doc', content: [] });
  });

  it('converts a single element to a screenplayBlock node', () => {
    const elements: ScreenplayElement[] = [
      { id: 'a1', type: 'ACTION', text: 'John enters.', order: 0 },
    ];

    const doc = elementsToEditorState(elements);
    expect(doc.content).toHaveLength(1);
    expect(doc.content![0]).toEqual({
      type: 'screenplayBlock',
      attrs: { elementType: 'ACTION', elementId: 'a1', order: 0 },
      content: [{ type: 'text', text: 'John enters.' }],
    });
  });

  it('omits content array for empty text', () => {
    const elements: ScreenplayElement[] = [
      { id: 'a1', type: 'ACTION', text: '', order: 0 },
    ];

    const doc = elementsToEditorState(elements);
    expect(doc.content![0].content).toBeUndefined();
  });

  it('converts all element types correctly', () => {
    const elements: ScreenplayElement[] = [
      { id: 's1', type: 'SCENE_HEADING', text: 'INT. OFFICE - DAY', order: 0 },
      { id: 'a1', type: 'ACTION', text: 'John enters.', order: 1 },
      { id: 'c1', type: 'CHARACTER', text: 'JOHN', order: 2 },
      { id: 'd1', type: 'DIALOGUE', text: 'Hello.', order: 3 },
      { id: 'p1', type: 'PARENTHETICAL', text: 'smiling', order: 4 },
      { id: 't1', type: 'TRANSITION', text: 'CUT TO:', order: 5 },
      { id: 'tp1', type: 'TITLE_PAGE', text: 'My Script', order: 6 },
    ];

    const doc = elementsToEditorState(elements);
    expect(doc.content).toHaveLength(7);
    expect(doc.content![0].attrs?.elementType).toBe('SCENE_HEADING');
    expect(doc.content![1].attrs?.elementType).toBe('ACTION');
    expect(doc.content![2].attrs?.elementType).toBe('CHARACTER');
    expect(doc.content![3].attrs?.elementType).toBe('DIALOGUE');
    expect(doc.content![4].attrs?.elementType).toBe('PARENTHETICAL');
    expect(doc.content![5].attrs?.elementType).toBe('TRANSITION');
    expect(doc.content![6].attrs?.elementType).toBe('TITLE_PAGE');
  });
});

describe('round-trip conversion', () => {
  it('elements → doc → elements produces equivalent result', () => {
    const original: ScreenplayElement[] = [
      { id: 's1', type: 'SCENE_HEADING', text: 'INT. OFFICE - DAY', order: 0 },
      { id: 'a1', type: 'ACTION', text: 'John enters the room.', order: 1 },
      { id: 'c1', type: 'CHARACTER', text: 'JOHN', order: 2 },
      { id: 'd1', type: 'DIALOGUE', text: 'Hello, world.', order: 3 },
    ];

    const doc = elementsToEditorState(original);
    const result = editorStateToElements(doc);
    expect(result).toEqual(original);
  });

  it('doc → elements → doc produces equivalent result', () => {
    const originalDoc: TipTapDocJSON = {
      type: 'doc',
      content: [
        {
          type: 'screenplayBlock',
          attrs: { elementType: 'TRANSITION', elementId: 't1', order: 0 },
          content: [{ type: 'text', text: 'FADE IN:' }],
        },
        {
          type: 'screenplayBlock',
          attrs: { elementType: 'SCENE_HEADING', elementId: 's1', order: 1 },
          content: [{ type: 'text', text: 'EXT. PARK - NIGHT' }],
        },
      ],
    };

    const elements = editorStateToElements(originalDoc);
    const resultDoc = elementsToEditorState(elements);
    expect(resultDoc).toEqual(originalDoc);
  });

  it('round-trips empty text elements correctly', () => {
    const original: ScreenplayElement[] = [
      { id: 'a1', type: 'ACTION', text: '', order: 0 },
    ];

    const doc = elementsToEditorState(original);
    const result = editorStateToElements(doc);
    expect(result).toEqual(original);
  });
});
