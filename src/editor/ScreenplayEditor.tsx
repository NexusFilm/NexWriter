import { useEffect, useCallback } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { ScreenplayBlock } from './ScreenplayBlock';
import { KeyboardPlugin } from './KeyboardPlugin';
import { AutocompleteExtension } from './autocomplete/AutocompleteExtension';
import { AutocompletePopup } from './autocomplete/AutocompletePopup';
import { getAutocompleteState, hideAutocomplete, type Suggestion } from './autocomplete/autocompleteState';
import type { TipTapDocJSON } from './serialization';
import type { ElementType } from '@/types/screenplay';

interface ScreenplayEditorProps {
  content?: TipTapDocJSON;
  onUpdate?: (doc: TipTapDocJSON) => void;
  onEditorReady?: (editor: Editor) => void;
  onSelectionUpdate?: (elementType: ElementType | null) => void;
  /** List of unique character names from the current script for autocomplete */
  characterNames?: string[];
}

const DEFAULT_CONTENT: TipTapDocJSON = {
  type: 'doc',
  content: [
    {
      type: 'screenplayBlock',
      attrs: { elementType: 'ACTION', elementId: '', order: 0 },
    },
  ],
};

let latestCharacterNames: string[] = [];

export function ScreenplayEditor({ content, onUpdate, onEditorReady, onSelectionUpdate, characterNames = [] }: ScreenplayEditorProps) {
  useEffect(() => {
    latestCharacterNames = characterNames;
  }, [characterNames]);

  const editor = useEditor({
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
        underline: false,
      }),
      ScreenplayBlock,
      Underline,
      KeyboardPlugin,
      AutocompleteExtension.configure({
        getCharacterNames: () => latestCharacterNames,
      }),
    ],
    editable: true,
    content: content ?? DEFAULT_CONTENT,
    onUpdate: ({ editor: ed }) => {
      if (onUpdate) {
        onUpdate(ed.getJSON() as TipTapDocJSON);
      }
    },
    onSelectionUpdate: ({ editor: ed }) => {
      if (onSelectionUpdate) {
        const attrs = ed.getAttributes('screenplayBlock');
        const elementType = (attrs?.elementType as ElementType) ?? null;
        onSelectionUpdate(elementType);
      }
    },
    onTransaction: ({ editor: ed }) => {
      // Also report on transaction for element type changes via Tab
      if (onSelectionUpdate) {
        const attrs = ed.getAttributes('screenplayBlock');
        const elementType = (attrs?.elementType as ElementType) ?? null;
        onSelectionUpdate(elementType);
      }
    },
  });

  // Notify parent when editor is ready
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Sync external content changes into the editor
  useEffect(() => {
    if (editor && content) {
      const currentJSON = JSON.stringify(editor.getJSON());
      const incomingJSON = JSON.stringify(content);
      if (currentJSON !== incomingJSON) {
        editor.commands.setContent(content);
      }
    }
  }, [editor, content]);

  // Handle accepting a suggestion from the popup (click)
  const handleAcceptSuggestion = useCallback(
    (suggestion: Suggestion) => {
      if (!editor) return;
      const acState = getAutocompleteState();
      if (!acState.visible) return;

      const { state, view } = editor;
      const { $from } = state.selection;

      // Find the current screenplayBlock
      for (let d = $from.depth; d >= 1; d--) {
        const node = $from.node(d);
        if (node.type.name === 'screenplayBlock') {
          const pos = $from.before(d);
          const elementType = node.attrs.elementType as ElementType;
          let newText = suggestion.text;

          // Determine effective type after potential conversion
          const effectiveType = suggestion.targetElementType ?? elementType;

          // For scene headings, build the full text
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

          const from = pos + 1;
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

          view.dispatch(tr);
          hideAutocomplete();
          break;
        }
      }
    },
    [editor],
  );

  return (
    <div
      style={{ minHeight: '100%', cursor: 'text' }}
      onClick={() => editor?.commands.focus()}
    >
      <EditorContent editor={editor} />
      <AutocompletePopup onAccept={handleAcceptSuggestion} />
    </div>
  );
}
