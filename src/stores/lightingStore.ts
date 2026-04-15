import { create } from 'zustand';
import type { LightingDiagram, DiagramElement } from '@/types/productionTools';

export interface LightingState {
  diagram: LightingDiagram | null;
  selectedElementId: string | null;
  setDiagram: (diagram: LightingDiagram) => void;
  addElement: (element: DiagramElement) => void;
  updateElement: (id: string, updates: Partial<DiagramElement>) => void;
  removeElement: (id: string) => void;
  selectElement: (id: string | null) => void;
}

export const useLightingStore = create<LightingState>((set, get) => ({
  diagram: null,
  selectedElementId: null,

  setDiagram: (diagram: LightingDiagram) => {
    set({ diagram, selectedElementId: null });
  },

  addElement: (element: DiagramElement) => {
    const { diagram } = get();
    if (!diagram) return;
    set({
      diagram: {
        ...diagram,
        elements: [...diagram.elements, element],
      },
    });
  },

  updateElement: (id: string, updates: Partial<DiagramElement>) => {
    const { diagram } = get();
    if (!diagram) return;
    set({
      diagram: {
        ...diagram,
        elements: diagram.elements.map((el) =>
          el.id === id ? { ...el, ...updates } : el
        ),
      },
    });
  },

  removeElement: (id: string) => {
    const { diagram, selectedElementId } = get();
    if (!diagram) return;
    set({
      diagram: {
        ...diagram,
        elements: diagram.elements.filter((el) => el.id !== id),
      },
      selectedElementId: selectedElementId === id ? null : selectedElementId,
    });
  },

  selectElement: (id: string | null) => {
    set({ selectedElementId: id });
  },
}));
