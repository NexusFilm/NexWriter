import { Extension } from '@tiptap/core';
import type { ElementType } from '../types/screenplay';

/**
 * The cycle order for Tab key — TITLE_PAGE is excluded from cycling.
 */
export const ELEMENT_TYPE_CYCLE: ElementType[] = [
  'SCENE_HEADING',
  'ACTION',
  'CHARACTER',
  'DIALOGUE',
  'PARENTHETICAL',
  'TRANSITION',
];

/**
 * Pure function: returns the next ElementType in the Tab cycle.
 * Types not in the cycle (e.g. TITLE_PAGE) wrap to SCENE_HEADING.
 */
export function cycleElementType(current: ElementType): ElementType {
  const idx = ELEMENT_TYPE_CYCLE.indexOf(current);
  if (idx === -1) {
    return ELEMENT_TYPE_CYCLE[0];
  }
  return ELEMENT_TYPE_CYCLE[(idx + 1) % ELEMENT_TYPE_CYCLE.length];
}

/**
 * Pure function: returns the previous ElementType in the Tab cycle (reverse).
 */
export function reverseCycleElementType(current: ElementType): ElementType {
  const idx = ELEMENT_TYPE_CYCLE.indexOf(current);
  if (idx === -1) {
    return ELEMENT_TYPE_CYCLE[ELEMENT_TYPE_CYCLE.length - 1];
  }
  return ELEMENT_TYPE_CYCLE[(idx - 1 + ELEMENT_TYPE_CYCLE.length) % ELEMENT_TYPE_CYCLE.length];
}

/**
 * Pure function: determines the ElementType for a new block created on Enter.
 * If the current block is empty, returns ACTION (convert-in-place).
 * Otherwise follows the context-aware rules from the spec.
 */
export function getNextElementTypeOnEnter(
  currentType: ElementType,
  isEmpty: boolean,
): ElementType {
  if (isEmpty) {
    return 'ACTION';
  }

  switch (currentType) {
    case 'CHARACTER':
      return 'DIALOGUE';
    case 'DIALOGUE':
      return 'CHARACTER';
    case 'TRANSITION':
      return 'SCENE_HEADING';
    case 'ACTION':
      return 'ACTION';
    default:
      return 'ACTION';
  }
}

/**
 * Helper: finds the current screenplayBlock and changes its elementType.
 */
function setCurrentBlockType(editor: { state: any; view: any }, type: ElementType): boolean {
  const { state, view } = editor;
  const { $from } = state.selection;

  for (let d = $from.depth; d >= 1; d--) {
    const node = $from.node(d);
    if (node.type.name === 'screenplayBlock') {
      const blockPos = $from.before(d);
      view.dispatch(
        state.tr.setNodeMarkup(blockPos, undefined, {
          ...node.attrs,
          elementType: type,
        }),
      );
      return true;
    }
  }
  return false;
}

/**
 * TipTap Extension that handles screenplay-specific keyboard behavior:
 * - Tab: cycles the current block's elementType forward
 * - Shift+Tab: cycles the current block's elementType backward
 * - Ctrl+1-6: directly set element type (Scene, Action, Character, Dialogue, Paren, Transition)
 * - Enter: context-aware new block creation based on current element type
 */
export const KeyboardPlugin = Extension.create({
  name: 'screenplayKeyboard',

  addKeyboardShortcuts() {
    return {
      // Ctrl+1 = Scene Heading
      'Mod-1': ({ editor }) => setCurrentBlockType(editor, 'SCENE_HEADING'),
      // Ctrl+2 = Action
      'Mod-2': ({ editor }) => setCurrentBlockType(editor, 'ACTION'),
      // Ctrl+3 = Character
      'Mod-3': ({ editor }) => setCurrentBlockType(editor, 'CHARACTER'),
      // Ctrl+4 = Dialogue
      'Mod-4': ({ editor }) => setCurrentBlockType(editor, 'DIALOGUE'),
      // Ctrl+5 = Parenthetical
      'Mod-5': ({ editor }) => setCurrentBlockType(editor, 'PARENTHETICAL'),
      // Ctrl+6 = Transition
      'Mod-6': ({ editor }) => setCurrentBlockType(editor, 'TRANSITION'),

      // Shift+Tab: reverse cycle element type
      'Shift-Tab': ({ editor }) => {
        const { state, view } = editor;
        const { $from } = state.selection;

        for (let d = $from.depth; d >= 1; d--) {
          const node = $from.node(d);
          if (node.type.name === 'screenplayBlock') {
            const blockPos = $from.before(d);
            const currentType = node.attrs.elementType as ElementType;
            const prevType = reverseCycleElementType(currentType);
            view.dispatch(
              state.tr.setNodeMarkup(blockPos, undefined, {
                ...node.attrs,
                elementType: prevType,
              }),
            );
            return true;
          }
        }
        return false;
      },

      Tab: ({ editor }) => {
        const { state, view } = editor;
        const { $from } = state.selection;

        // Find the closest screenplayBlock node
        const depth = $from.depth;
        let blockPos: number | null = null;
        let blockNode = null;

        for (let d = depth; d >= 1; d--) {
          const node = $from.node(d);
          if (node.type.name === 'screenplayBlock') {
            blockPos = $from.before(d);
            blockNode = node;
            break;
          }
        }

        if (blockPos === null || !blockNode) {
          return false;
        }

        const currentType = blockNode.attrs.elementType as ElementType;
        const nextType = cycleElementType(currentType);

        view.dispatch(
          state.tr.setNodeMarkup(blockPos, undefined, {
            ...blockNode.attrs,
            elementType: nextType,
          }),
        );

        return true;
      },

      Enter: ({ editor }) => {
        const { state, view } = editor;
        const { $from } = state.selection;

        // Find the closest screenplayBlock node
        const depth = $from.depth;
        let blockDepth: number | null = null;
        let blockNode = null;

        for (let d = depth; d >= 1; d--) {
          const node = $from.node(d);
          if (node.type.name === 'screenplayBlock') {
            blockDepth = d;
            blockNode = node;
            break;
          }
        }

        if (blockDepth === null || !blockNode) {
          return false;
        }

        const currentType = blockNode.attrs.elementType as ElementType;
        const blockTextContent = blockNode.textContent;
        const isEmpty = blockTextContent.length === 0;

        if (isEmpty) {
          // Convert the current empty block to ACTION
          const blockPos = $from.before(blockDepth);
          view.dispatch(
            state.tr.setNodeMarkup(blockPos, undefined, {
              ...blockNode.attrs,
              elementType: 'ACTION',
            }),
          );
          return true;
        }

        // Determine the next element type for the new block
        const nextType = getNextElementTypeOnEnter(currentType, false);

        // Split the block at the cursor position, then update the new block's type
        const tr = state.tr;
        const splitPos = $from.after(blockDepth);

        // Create a new screenplayBlock node with the determined type
        const newBlock = state.schema.nodes.screenplayBlock.create(
          {
            elementType: nextType,
            elementId: '',
            order: 0,
          },
        );

        // If cursor is at the end of the block, insert a new empty block after
        const isAtEnd = $from.parentOffset === $from.parent.content.size;

        if (isAtEnd) {
          tr.insert(splitPos, newBlock);
          // Move cursor into the new block
          const newPos = splitPos + 1;
          tr.setSelection(
            state.selection.constructor === state.selection.constructor
              ? (state.selection as any).constructor.near(tr.doc.resolve(newPos))
              : state.selection,
          );
          view.dispatch(tr);
        } else {
          // Split the block and set the new block's type
          // Use the built-in split, then update the new block's attrs
          const splitTr = state.tr.split($from.pos);
          // After split, the new block is at the position after the split
          // We need to find it and update its attrs
          const mappedPos = splitTr.mapping.map($from.after(blockDepth));
          const $newBlockPos = splitTr.doc.resolve(mappedPos);

          // Find the new block node position
          let newBlockPos: number | null = null;
          for (let d = $newBlockPos.depth; d >= 1; d--) {
            if ($newBlockPos.node(d).type.name === 'screenplayBlock') {
              newBlockPos = $newBlockPos.before(d);
              break;
            }
          }

          if (newBlockPos !== null) {
            const newNode = splitTr.doc.nodeAt(newBlockPos);
            if (newNode) {
              splitTr.setNodeMarkup(newBlockPos, undefined, {
                ...newNode.attrs,
                elementType: nextType,
              });
            }
          }

          view.dispatch(splitTr);
        }

        return true;
      },
    };
  },
});
