import { describe, it, expect } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { ScreenplayBlock, elementTypeToCssClass } from './ScreenplayBlock';
import type { ElementType } from '../types/screenplay';

function createEditor(content?: object) {
  return new Editor({
    extensions: [
      StarterKit.configure({
        paragraph: false,
        heading: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        codeBlock: false,
        horizontalRule: false,
        hardBreak: false,
      }),
      ScreenplayBlock,
    ],
    content: content ?? {
      type: 'doc',
      content: [
        {
          type: 'screenplayBlock',
          attrs: { elementType: 'ACTION', elementId: '', order: 0 },
        },
      ],
    },
  });
}

describe('elementTypeToCssClass', () => {
  const cases: [ElementType, string][] = [
    ['SCENE_HEADING', 'el-scene-heading'],
    ['ACTION', 'el-action'],
    ['CHARACTER', 'el-character'],
    ['DIALOGUE', 'el-dialogue'],
    ['PARENTHETICAL', 'el-parenthetical'],
    ['TRANSITION', 'el-transition'],
    ['TITLE_PAGE', 'el-title-page'],
  ];

  it.each(cases)('maps %s to %s', (type, expected) => {
    expect(elementTypeToCssClass(type)).toBe(expected);
  });
});

describe('ScreenplayBlock node', () => {
  it('creates an editor with a screenplayBlock node', () => {
    const editor = createEditor();
    const json = editor.getJSON();
    expect(json.content).toHaveLength(1);
    expect(json.content![0].type).toBe('screenplayBlock');
    editor.destroy();
  });

  it('stores elementType, elementId, and order attributes', () => {
    const editor = createEditor({
      type: 'doc',
      content: [
        {
          type: 'screenplayBlock',
          attrs: { elementType: 'SCENE_HEADING', elementId: 'abc-123', order: 5 },
          content: [{ type: 'text', text: 'INT. OFFICE - DAY' }],
        },
      ],
    });

    const node = editor.getJSON().content![0];
    expect(node.attrs?.elementType).toBe('SCENE_HEADING');
    expect(node.attrs?.elementId).toBe('abc-123');
    expect(node.attrs?.order).toBe(5);
    editor.destroy();
  });

  it('defaults elementType to ACTION', () => {
    const editor = createEditor({
      type: 'doc',
      content: [
        {
          type: 'screenplayBlock',
        },
      ],
    });

    const node = editor.getJSON().content![0];
    expect(node.attrs?.elementType).toBe('ACTION');
    editor.destroy();
  });

  it('renders HTML with correct CSS class and data attributes', () => {
    const editor = createEditor({
      type: 'doc',
      content: [
        {
          type: 'screenplayBlock',
          attrs: { elementType: 'CHARACTER', elementId: 'char-1', order: 2 },
          content: [{ type: 'text', text: 'JOHN' }],
        },
      ],
    });

    const html = editor.getHTML();
    expect(html).toContain('data-element-type="CHARACTER"');
    expect(html).toContain('data-element-id="char-1"');
    expect(html).toContain('data-order="2"');
    expect(html).toContain('class="el-character"');
    expect(html).toContain('JOHN');
    editor.destroy();
  });

  it('renders each element type with its correct CSS class', () => {
    const types: ElementType[] = [
      'SCENE_HEADING', 'ACTION', 'CHARACTER', 'DIALOGUE',
      'PARENTHETICAL', 'TRANSITION', 'TITLE_PAGE',
    ];

    for (const type of types) {
      const editor = createEditor({
        type: 'doc',
        content: [
          {
            type: 'screenplayBlock',
            attrs: { elementType: type, elementId: '', order: 0 },
            content: [{ type: 'text', text: 'test' }],
          },
        ],
      });

      const html = editor.getHTML();
      const expectedClass = elementTypeToCssClass(type);
      expect(html).toContain(`class="${expectedClass}"`);
      editor.destroy();
    }
  });

  it('parses HTML with data-element-type back into the correct node', () => {
    const editor = createEditor();
    editor.commands.setContent(
      '<div data-element-type="TRANSITION" data-element-id="t-1" data-order="3">FADE OUT.</div>'
    );

    const json = editor.getJSON();
    const node = json.content![0];
    expect(node.type).toBe('screenplayBlock');
    expect(node.attrs?.elementType).toBe('TRANSITION');
    expect(node.attrs?.elementId).toBe('t-1');
    expect(node.attrs?.order).toBe(3);
    editor.destroy();
  });

  it('supports multiple blocks in a document', () => {
    const editor = createEditor({
      type: 'doc',
      content: [
        {
          type: 'screenplayBlock',
          attrs: { elementType: 'SCENE_HEADING', elementId: 's1', order: 0 },
          content: [{ type: 'text', text: 'INT. OFFICE - DAY' }],
        },
        {
          type: 'screenplayBlock',
          attrs: { elementType: 'ACTION', elementId: 'a1', order: 1 },
          content: [{ type: 'text', text: 'John enters the room.' }],
        },
        {
          type: 'screenplayBlock',
          attrs: { elementType: 'CHARACTER', elementId: 'c1', order: 2 },
          content: [{ type: 'text', text: 'JOHN' }],
        },
        {
          type: 'screenplayBlock',
          attrs: { elementType: 'DIALOGUE', elementId: 'd1', order: 3 },
          content: [{ type: 'text', text: 'Hello, world.' }],
        },
      ],
    });

    const json = editor.getJSON();
    expect(json.content).toHaveLength(4);
    expect(json.content![0].attrs?.elementType).toBe('SCENE_HEADING');
    expect(json.content![1].attrs?.elementType).toBe('ACTION');
    expect(json.content![2].attrs?.elementType).toBe('CHARACTER');
    expect(json.content![3].attrs?.elementType).toBe('DIALOGUE');
    editor.destroy();
  });
});
