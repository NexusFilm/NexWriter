import type { ScreenplayElement, ElementType } from '../types/screenplay';

/**
 * TipTap JSON node shape for a screenplayBlock.
 */
interface ScreenplayBlockJSON {
  type: 'screenplayBlock';
  attrs?: {
    elementType?: ElementType;
    elementId?: string;
    order?: number;
  };
  content?: Array<{ type: 'text'; text: string }>;
}

/**
 * TipTap JSON document shape.
 */
export interface TipTapDocJSON {
  type: 'doc';
  content?: ScreenplayBlockJSON[];
}

/**
 * Convert a TipTap JSON document to a ScreenplayElement array.
 * Iterates over doc.content (screenplayBlock nodes) and extracts
 * elementType, elementId, order, and text content from each.
 */
export function editorStateToElements(doc: TipTapDocJSON): ScreenplayElement[] {
  if (!doc.content) return [];

  return doc.content.map((node, index) => {
    const attrs = node.attrs ?? {};
    const text = node.content
      ?.map((child) => child.text)
      .join('') ?? '';

    return {
      id: attrs.elementId ?? '',
      type: (attrs.elementType ?? 'ACTION') as ElementType,
      text,
      order: attrs.order ?? index,
    };
  });
}

/**
 * Convert a ScreenplayElement array to a TipTap-compatible JSON document.
 * Each element becomes a screenplayBlock node with attrs and text content.
 */
export function elementsToEditorState(elements: ScreenplayElement[]): TipTapDocJSON {
  const content: ScreenplayBlockJSON[] = elements.map((el) => {
    const node: ScreenplayBlockJSON = {
      type: 'screenplayBlock',
      attrs: {
        elementType: el.type,
        elementId: el.id,
        order: el.order,
      },
    };

    if (el.text.length > 0) {
      node.content = [{ type: 'text', text: el.text }];
    }

    return node;
  });

  return { type: 'doc', content };
}
