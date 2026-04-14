import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from './uiStore';

describe('UIStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      paywallModalVisible: false,
      toastQueue: [],
      sidebarOpen: false,
    });
  });

  describe('paywallModal', () => {
    it('defaults to hidden', () => {
      expect(useUIStore.getState().paywallModalVisible).toBe(false);
    });

    it('showPaywallModal sets visible to true', () => {
      useUIStore.getState().showPaywallModal();
      expect(useUIStore.getState().paywallModalVisible).toBe(true);
    });

    it('hidePaywallModal sets visible to false', () => {
      useUIStore.getState().showPaywallModal();
      useUIStore.getState().hidePaywallModal();
      expect(useUIStore.getState().paywallModalVisible).toBe(false);
    });
  });

  describe('toastQueue', () => {
    it('defaults to empty array', () => {
      expect(useUIStore.getState().toastQueue).toEqual([]);
    });

    it('addToast appends a toast with a generated id', () => {
      useUIStore.getState().addToast({ message: 'Hello', type: 'info' });
      const queue = useUIStore.getState().toastQueue;
      expect(queue).toHaveLength(1);
      expect(queue[0].message).toBe('Hello');
      expect(queue[0].type).toBe('info');
      expect(queue[0].id).toBeTruthy();
    });

    it('addToast generates unique ids for each toast', () => {
      useUIStore.getState().addToast({ message: 'A', type: 'success' });
      useUIStore.getState().addToast({ message: 'B', type: 'error' });
      const queue = useUIStore.getState().toastQueue;
      expect(queue).toHaveLength(2);
      expect(queue[0].id).not.toBe(queue[1].id);
    });

    it('removeToast removes the toast with the given id', () => {
      useUIStore.getState().addToast({ message: 'A', type: 'info' });
      useUIStore.getState().addToast({ message: 'B', type: 'warning' });
      const idToRemove = useUIStore.getState().toastQueue[0].id;
      useUIStore.getState().removeToast(idToRemove);
      const queue = useUIStore.getState().toastQueue;
      expect(queue).toHaveLength(1);
      expect(queue[0].message).toBe('B');
    });

    it('removeToast with non-existent id does nothing', () => {
      useUIStore.getState().addToast({ message: 'A', type: 'info' });
      useUIStore.getState().removeToast('non-existent-id');
      expect(useUIStore.getState().toastQueue).toHaveLength(1);
    });
  });

  describe('sidebar', () => {
    it('defaults to closed', () => {
      expect(useUIStore.getState().sidebarOpen).toBe(false);
    });

    it('toggleSidebar opens when closed', () => {
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });

    it('toggleSidebar closes when open', () => {
      useUIStore.getState().toggleSidebar();
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(false);
    });
  });
});
