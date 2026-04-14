import { create } from 'xmlbuilder2';
import type { ScreenplayElement, ElementType } from '@/types/screenplay';

/**
 * Map internal ElementType to Final Draft paragraph Type attribute.
 */
const ELEMENT_TO_FDX_TYPE: Record<ElementType, string> = {
  SCENE_HEADING: 'Scene Heading',
  ACTION: 'Action',
  CHARACTER: 'Character',
  DIALOGUE: 'Dialogue',
  PARENTHETICAL: 'Parenthetical',
  TRANSITION: 'Transition',
  TITLE_PAGE: 'Action', // FDX doesn't have a dedicated title page paragraph type
};

const FDX_TYPE_TO_ELEMENT: Record<string, ElementType> = {
  'Scene Heading': 'SCENE_HEADING',
  'Action': 'ACTION',
  'Character': 'CHARACTER',
  'Dialogue': 'DIALOGUE',
  'Parenthetical': 'PARENTHETICAL',
  'Transition': 'TRANSITION',
};

/**
 * Export ScreenplayElement[] to Final Draft XML (.fdx) string.
 */
export function exportFDX(elements: ScreenplayElement[]): string {
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('FinalDraft', {
      DocumentType: 'Script',
      Template: 'No',
      Version: '1',
    })
    .ele('Content');

  for (const el of elements) {
    const fdxType = ELEMENT_TO_FDX_TYPE[el.type];
    const para = root.ele('Paragraph', { Type: fdxType });
    // Store original element metadata as attributes for round-trip fidelity
    para.att('ElementId', el.id);
    para.att('ElementType', el.type);
    para.att('Order', String(el.order));
    para.ele('Text', { 'xml:space': 'preserve' }).txt(el.text);
  }

  return root.doc().end({ prettyPrint: true });
}

/**
 * Safely get the first child of an xmlbuilder2 node, returning null if none.
 */
function safeFirst(node: ReturnType<typeof create>): ReturnType<typeof create> | null {
  try {
    return node.first();
  } catch {
    return null;
  }
}

/**
 * Safely get the next sibling of an xmlbuilder2 node, returning null if none.
 */
function safeNext(node: ReturnType<typeof create>): ReturnType<typeof create> | null {
  try {
    return node.next();
  } catch {
    return null;
  }
}

/**
 * Parse a Final Draft XML (.fdx) string back to ScreenplayElement[].
 */
export function parseFDX(fdx: string): ScreenplayElement[] {
  const doc = create(fdx);
  const elements: ScreenplayElement[] = [];

  const root = doc.root();
  if (!root) return elements;

  // Navigate to Content node
  let contentNode = root;
  const rootName = root.node.nodeName;
  if (rootName === 'FinalDraft') {
    let child = safeFirst(root);
    while (child) {
      if (child.node.nodeName === 'Content') {
        contentNode = child;
        break;
      }
      child = safeNext(child);
    }
  }

  // Iterate Paragraph children
  let para = safeFirst(contentNode);
  let index = 0;
  while (para) {
    if (para.node.nodeName === 'Paragraph') {
      const node = para.node as unknown as Element;
      const elementType = node.getAttribute('ElementType');
      const elementId = node.getAttribute('ElementId');
      const order = node.getAttribute('Order');
      const fdxType = node.getAttribute('Type') || '';

      // Determine the element type: prefer stored ElementType, fall back to FDX Type mapping
      let type: ElementType;
      if (elementType && isValidElementType(elementType)) {
        type = elementType as ElementType;
      } else {
        type = FDX_TYPE_TO_ELEMENT[fdxType] || 'ACTION';
      }

      // Extract text from Text child
      let text = '';
      let textChild = safeFirst(para);
      while (textChild) {
        if (textChild.node.nodeName === 'Text') {
          text = textChild.node.textContent || '';
          break;
        }
        textChild = safeNext(textChild);
      }

      elements.push({
        id: elementId || `fdx-${index}`,
        type,
        text,
        order: order ? parseInt(order, 10) : index,
      });
      index++;
    }
    para = safeNext(para);
  }

  return elements;
}

function isValidElementType(value: string): value is ElementType {
  return [
    'SCENE_HEADING', 'ACTION', 'CHARACTER', 'DIALOGUE',
    'PARENTHETICAL', 'TRANSITION', 'TITLE_PAGE',
  ].includes(value);
}
