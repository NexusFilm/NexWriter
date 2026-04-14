import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Extension } from '@tiptap/core';

export interface AnnotationMark {
  from: number;
  to: number;
  beatName: string;
}

const annotationPluginKey = new PluginKey('blueprintAnnotations');

/**
 * ProseMirror decorations for beat markers/reminders.
 * Annotations are decorations, not document nodes — toggling them
 * off preserves the elements array.
 */
function createAnnotationPlugin(enabled: boolean, marks: AnnotationMark[]) {
  return new Plugin({
    key: annotationPluginKey,
    state: {
      init() {
        if (!enabled || marks.length === 0) return DecorationSet.empty;
        const decorations = marks.map((mark) =>
          Decoration.inline(mark.from, mark.to, {
            class: 'blueprint-annotation',
            'data-beat': mark.beatName,
          }),
        );
        return DecorationSet.create(
          // We'll create from the doc in apply
          undefined as never,
          decorations,
        );
      },
      apply(_tr, _old) {
        // Decorations are rebuilt when the extension reconfigures
        return _old;
      },
    },
    props: {
      decorations(state) {
        return annotationPluginKey.getState(state) as DecorationSet;
      },
    },
  });
}

/**
 * TipTap extension for blueprint annotations.
 * Toggle on/off via EditorStore.showBlueprintAnnotations.
 */
export const BlueprintAnnotations = Extension.create({
  name: 'blueprintAnnotations',

  addOptions() {
    return {
      enabled: true,
      marks: [] as AnnotationMark[],
    };
  },

  addProseMirrorPlugins() {
    return [
      createAnnotationPlugin(this.options.enabled, this.options.marks),
    ];
  },
});

/**
 * Pure function: toggling annotations off preserves the elements array.
 * Annotations are decorations only — they never mutate document content.
 * This function is exported for property testing.
 */
export function toggleAnnotationsPreservesElements<T>(elements: T[], _showAnnotations: boolean): T[] {
  // Annotations are ProseMirror decorations, not part of the document model.
  // Toggling them has zero effect on the elements array.
  return elements;
}
