import { create } from 'zustand';
import type { BlogPost } from '@/types/blog';
import type { AdminUserRow, FeatureFlag } from '@/types/productionTools';

export interface AdminState {
  metrics: { totalUsers: number; totalScripts: number; activeUsers7d: number } | null;
  users: AdminUserRow[];
  userTotal: number;
  userPage: number;
  blogPosts: BlogPost[];
  flags: FeatureFlag[];
  setMetrics: (m: AdminState['metrics']) => void;
  setUsers: (users: AdminUserRow[], total: number) => void;
  setUserPage: (page: number) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  metrics: null,
  users: [],
  userTotal: 0,
  userPage: 1,
  blogPosts: [],
  flags: [],

  setMetrics: (metrics) => set({ metrics }),

  setUsers: (users, total) => set({ users, userTotal: total }),

  setUserPage: (page) => set({ userPage: page }),
}));
