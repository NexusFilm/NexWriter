import { create } from 'zustand';
import type { UIState, Toast } from '@/types/stores';

export const useUIStore = create<UIState>((set) => ({
  paywallModalVisible: false,
  toastQueue: [] as Toast[],
  sidebarOpen: false,

  showPaywallModal: () => set({ paywallModalVisible: true }),

  hidePaywallModal: () => set({ paywallModalVisible: false }),

  addToast: (toast: Omit<Toast, 'id'>) =>
    set((state) => ({
      toastQueue: [
        ...state.toastQueue,
        { ...toast, id: crypto.randomUUID() },
      ],
    })),

  removeToast: (id: string) =>
    set((state) => ({
      toastQueue: state.toastQueue.filter((t) => t.id !== id),
    })),

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
