import { create } from 'zustand';
import type { BlueprintState } from '@/types/stores';
import type { Framework } from '@/types/blueprint';

export const useBlueprintStore = create<BlueprintState>((set) => ({
  framework: null,
  genre: '',
  format: '',
  tone: '',
  currentBeatIndex: 0,
  answers: {},
  sessionId: null,

  setFramework: (fw: Framework) => {
    set({ framework: fw, currentBeatIndex: 0, answers: {} });
  },

  setGenreToneFormat: (genre: string, format: string, tone: string) => {
    set({ genre, format, tone });
  },

  advanceBeat: () => {
    set((state) => ({ currentBeatIndex: state.currentBeatIndex + 1 }));
  },

  setAnswer: (beatId: string, answer: string) => {
    set((state) => ({
      answers: { ...state.answers, [beatId]: answer },
    }));
  },
}));
