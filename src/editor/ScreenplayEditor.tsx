import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { ScreenplayBlock } from './ScreenplayBlock';
import { KeyboardPlugin } from './KeyboardPlugin';
import type { TipTapDocJSON } from './serialization';

interface ScreenplayEditorProps {
  content?: TipTapDocJSON;
  onUpdate?: (doc: TipTapDocJSON) => void;
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

export function ScreenplayEditor({ content, onUpdate }: ScreenplayEditorProps) {
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
      }),
      ScreenplayBlock,
      Underline,
      KeyboardPlugin,
    ],
    editable: true,
    content: content ?? DEFAULT_CONTENT,
    onUpdate: ({ editor: ed }) => {
      if (onUpdate) {
        onUpdate(ed.getJSON() as TipTapDocJSON);
      }
    },
  });

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

  return (
    <div
      style={{ minHeight: '100%', cursor: 'text' }}
      onClick={() => editor?.commands.focus()}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
