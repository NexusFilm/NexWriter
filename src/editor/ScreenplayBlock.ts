import { Node, mergeAttributes } from '@tiptap/core';
import type { ElementType } from '../types/screenplay';

/**
 * Maps an ElementType to its corresponding CSS class name.
 */
export function elementTypeToCssClass(elementType: ElementType): string {
  const map: Record<ElementType, string> = {
    SCENE_HEADING: 'el-scene-heading',
    ACTION: 'el-action',
    CHARACTER: 'el-character',
    DIALOGUE: 'el-dialogue',
    PARENTHETICAL: 'el-parenthetical',
    TRANSITION: 'el-transition',
    TITLE_PAGE: 'el-title-page',
  };
  return map[elementType] ?? 'el-action';
}

export const ScreenplayBlock = Node.create({
  name: 'screenplayBlock',
  group: 'block',
  content: 'inline*',

  addAttributes() {
    return {
      elementType: {
        default: 'ACTION' as ElementType,
        parseHTML: (element) => element.getAttribute('data-element-type') || 'ACTION',
        renderHTML: (attributes) => ({
          'data-element-type': attributes.elementType,
        }),
      },
      elementId: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-element-id') || '',
        renderHTML: (attributes) => ({
          'data-element-id': attributes.elementId,
        }),
      },
      order: {
        default: 0,
        parseHTML: (element) => Number(element.getAttribute('data-order')) || 0,
        renderHTML: (attributes) => ({
          'data-order': String(attributes.order),
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-element-type]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const elementType = node.attrs.elementType as ElementType;
    const cssClass = elementTypeToCssClass(elementType);

    return [
      'div',
      mergeAttributes(HTMLAttributes, { class: cssClass }),
      0,
    ];
  },
});
