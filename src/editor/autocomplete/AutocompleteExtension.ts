import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import type { ElementType } from '@/types/screenplay';
import type { Suggestion } from './autocompleteState';
import { getSuggestions } from './AutocompleteEngine';
import {
  getAutocompleteState,
  showAutocomplete,
  hideAutocomplete,
  setSelectedIndex,
} from './autocompleteState';

const autocompletePluginKey = new PluginKey('autocomplete');

/**
 * Finds the screenplayBlock node at the current cursor position.
 * Returns the node, its position, depth, and its element type.
 */
function findCurrentBlock(view: EditorView) {
  const { state } = view;
  const { $from } = state.selection;

  for (let d = $from.depth; d >= 1; d--) {
    const node = $from.node(d);
    if (node.type.name === 'screenplayBlock') {
      return {
        node,
        pos: $from.before(d),
        depth: d,
        elementType: node.attrs.elementType as ElementType,
        text: node.textContent,
      };
    }
  }
  return null;
}

/**
 * Replaces the text content of the current screenplayBlock with the given suggestion.
 * If the suggestion has a targetElementType, also converts the block type.
 * For scene headings, handles partial replacement (prefix → location → time).
 */
function acceptSuggestion(view: EditorView, suggestion: Suggestion) {
  const block = findCurrentBlock(view);
  if (!block) return false;

  const { state } = view;
  const { node, pos, elementType } = block;

  let newText = suggestion.text;

  // Determine the effective element type after potential conversion
  const effectiveType = suggestion.targetElementType ?? elementType;

  // For scene headings (either current or target), handle multi-phase text building
  if (effectiveType === 'SCENE_HEADING' && elementType === 'SCENE_HEADING') {
    const currentText = node.textContent.toUpperCase().trimStart();
    const prefixPattern = /^(INT\.\/?EXT\.|EXT\.\/?INT\.|INT\.|EXT\.|I\/E\.)\s*/i;
    const prefixMatch = currentText.match(prefixPattern);

    if (prefixMatch) {
      const prefix = prefixMatch[0].trimEnd();
      const afterPrefix = currentText.slice(prefixMatch[0].length);

      if (suggestion.text.startsWith('- ')) {
        const dashIdx = afterPrefix.indexOf(' - ');
        const location = dashIdx >= 0 ? afterPrefix.slice(0, dashIdx) : afterPrefix.trimEnd();
        newText = prefix + ' ' + location + ' ' + suggestion.text;
      } else if (!suggestion.text.match(/^(INT\.|EXT\.|INT\.\/?EXT\.|I\/E\.)/)) {
        newText = prefix + ' ' + suggestion.text;
      }
    }
  }

  // Replace the entire text content of the block
  const from = pos + 1; // +1 to skip the opening tag
  const to = from + node.content.size;

  const tr = state.tr;
  if (node.content.size > 0) {
    tr.delete(from, to);
  }
  tr.insertText(newText, from);

  // If targetElementType is set and differs from current, convert the block
  if (suggestion.targetElementType && suggestion.targetElementType !== elementType) {
    tr.setNodeMarkup(pos, undefined, {
      ...node.attrs,
      elementType: suggestion.targetElementType,
    });
  }

  // Move cursor to end of inserted text
  const newCursorPos = from + newText.length;
  tr.setSelection(state.selection.constructor === state.selection.constructor
    ? (state.selection as any).constructor.near(tr.doc.resolve(newCursorPos))
    : state.selection);

  view.dispatch(tr);
  hideAutocomplete();
  return true;
}

export interface AutocompleteExtensionOptions {
  /** Callback to get the list of character names currently in the script */
  getCharacterNames: () => string[];
}

export const AutocompleteExtension = Extension.create<AutocompleteExtensionOptions>({
  name: 'autocomplete',

  addOptions() {
    return {
      getCharacterNames: () => [],
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        const acState = getAutocompleteState();
        if (!acState.visible || acState.suggestions.length === 0) {
          return false;
        }
        const suggestion = acState.suggestions[acState.selectedIndex];
        return acceptSuggestion(editor.view, suggestion);
      },

      ArrowDown: () => {
        const acState = getAutocompleteState();
        if (!acState.visible) return false;
        const next = (acState.selectedIndex + 1) % acState.suggestions.length;
        setSelectedIndex(next);
        return true;
      },

      ArrowUp: () => {
        const acState = getAutocompleteState();
        if (!acState.visible) return false;
        const prev = (acState.selectedIndex - 1 + acState.suggestions.length) % acState.suggestions.length;
        setSelectedIndex(prev);
        return true;
      },

      Escape: () => {
        const acState = getAutocompleteState();
        if (!acState.visible) return false;
        hideAutocomplete();
        return true;
      },
    };
  },

  addProseMirrorPlugins() {
    const extensionOptions = this.options;

    return [
      new Plugin({
        key: autocompletePluginKey,

        view() {
          return {
            update(view: EditorView) {
              const block = findCurrentBlock(view);
              if (!block) {
                hideAutocomplete();
                return;
              }

              const { elementType, text } = block;
              const characters = extensionOptions.getCharacterNames();
              const suggestions = getSuggestions(text, elementType, characters);

              if (suggestions.length === 0) {
                hideAutocomplete();
                return;
              }

              try {
                const coords = view.coordsAtPos(view.state.selection.from);
                showAutocomplete(
                  suggestions,
                  { top: coords.top, left: coords.left, bottom: coords.bottom },
                  text,
                );
              } catch {
                hideAutocomplete();
              }
            },

            destroy() {
              hideAutocomplete();
            },
          };
        },
      }),
    ];
  },
});
