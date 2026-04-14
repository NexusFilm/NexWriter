import { create } from 'zustand';
import type { EditorState } from '@/types/stores';
import type { ScreenplayElement } from '@/types/screenplay';
import type { SaveStatus } from '@/types/ui';
import { cycleElementType } from '@/editor/KeyboardPlugin';

export const useEditorStore = create<EditorState>((set, get) => ({
  script: null,
  elements: [],
  saveStatus: 'saved' as SaveStatus,
  activePanelTab: null,
  showBlueprintAnnotations: true,

  setElements: (elements: ScreenplayElement[]) => {
    set({ elements });
  },

  updateElement: (id: string, updates: Partial<ScreenplayElement>) => {
    const { elements } = get();
    set({
      elements: elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el,
      ),
    });
  },

  insertElement: (afterId: string, element: ScreenplayElement) => {
    const { elements } = get();
    const idx = elements.findIndex((el) => el.id === afterId);
    if (idx === -1) {
      set({ elements: [...elements, element] });
      return;
    }
    const newElements = [
      ...elements.slice(0, idx + 1),
      element,
      ...elements.slice(idx + 1),
    ];
    // Reorder after insertion
    set({
      elements: newElements.map((el, i) => ({ ...el, order: i })),
    });
  },

  deleteElement: (id: string) => {
    const { elements } = get();
    const filtered = elements.filter((el) => el.id !== id);
    // Reorder remaining elements
    set({
      elements: filtered.map((el, i) => ({ ...el, order: i })),
    });
  },

  cycleElementType: (id: string) => {
    const { elements } = get();
    set({
      elements: elements.map((el) =>
        el.id === id ? { ...el, type: cycleElementType(el.type) } : el,
      ),
    });
  },

  setSaveStatus: (status: SaveStatus) => {
    set({ saveStatus: status });
  },

  setActivePanelTab: (tab: 'scenes' | 'characters' | 'beats' | null) => {
    set({ activePanelTab: tab });
  },
}));
