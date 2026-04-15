import { create } from 'zustand';
import type { ShotList, ShotEntry } from '@/types/productionTools';

export interface ShotListState {
  currentList: ShotList | null;
  entries: ShotEntry[];
  loading: boolean;
  setCurrentList: (list: ShotList | null) => void;
  setEntries: (entries: ShotEntry[]) => void;
  addEntry: (entry: ShotEntry) => void;
  updateEntry: (id: string, updates: Partial<ShotEntry>) => void;
  removeEntry: (id: string) => void;
  reorderEntries: (orderedIds: string[]) => void;
}

export const useShotListStore = create<ShotListState>((set, get) => ({
  currentList: null,
  entries: [],
  loading: false,

  setCurrentList: (list: ShotList | null) => {
    set({ currentList: list });
  },

  setEntries: (entries: ShotEntry[]) => {
    set({ entries });
  },

  addEntry: (entry: ShotEntry) => {
    set({ entries: [...get().entries, entry] });
  },

  updateEntry: (id: string, updates: Partial<ShotEntry>) => {
    set({
      entries: get().entries.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    });
  },

  removeEntry: (id: string) => {
    set({ entries: get().entries.filter((e) => e.id !== id) });
  },

  reorderEntries: (orderedIds: string[]) => {
    const { entries } = get();
    const entryMap = new Map(entries.map((e) => [e.id, e]));
    const reordered: ShotEntry[] = [];
    for (const id of orderedIds) {
      const entry = entryMap.get(id);
      if (entry) {
        reordered.push({ ...entry, shotOrder: reordered.length });
      }
    }
    set({ entries: reordered });
  },
}));
