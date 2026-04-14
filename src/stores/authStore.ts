import { create } from 'zustand';
import { AuthRepository } from '@/repositories/AuthRepository';
import { supabase } from '@/lib/supabase';
import type { AuthState } from '@/types/stores';
import type { Tier } from '@/types/subscription';

const authRepo = new AuthRepository();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tier: 'free' as Tier,
  loading: true,

  signIn: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const user = await authRepo.signIn(email, password);
      set({ user, loading: false });
      await get().refreshTier();
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  signInWithProvider: async (provider: 'google' | 'github') => {
    await authRepo.signInWithProvider(provider);
  },

  signUp: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const user = await authRepo.signUp(email, password);
      set({ user, tier: 'free', loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  signOut: async () => {
    await authRepo.signOut();
    set({ user: null, tier: 'free' });
  },

  refreshTier: async () => {
    const { user } = get();
    if (!user) return;

    const { data, error } = await supabase
      .from('sw_user_profiles')
      .select('tier')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      set({ tier: data.tier as Tier });
    }
  },
}));
