import { create } from 'zustand';
import { AuthRepository } from '@/repositories/AuthRepository';
import { supabase, hasSupabase } from '@/lib/supabase';
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
    if (!user || !supabase) return;

    try {
      // Try to get existing profile
      const { data, error } = await supabase
        .from('sw_user_profiles')
        .select('tier')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data) {
        set({ tier: data.tier as Tier });
        return;
      }

      // Profile doesn't exist yet — create it (OAuth users may not trigger the DB hook)
      await supabase
        .from('sw_user_profiles')
        .upsert({
          id: user.id,
          email: user.email ?? '',
          tier: 'free',
          script_count: 0,
        }, { onConflict: 'id' });

      set({ tier: 'free' });
    } catch {
      // Silently default to free tier on any error
      set({ tier: 'free' });
    }
  },
}));

// Initialize auth state — check for existing session on app load
function initAuth() {
  if (!hasSupabase) {
    // No Supabase configured — stop loading, show login
    useAuthStore.setState({ loading: false });
    return;
  }

  supabase.auth.getSession().then(({ data }) => {
    if (data.session?.user) {
      useAuthStore.setState({ user: data.session.user, loading: false });
      useAuthStore.getState().refreshTier();
    } else {
      useAuthStore.setState({ loading: false });
    }
  }).catch(() => {
    useAuthStore.setState({ loading: false });
  });

  // Listen for auth state changes (e.g., after OAuth redirect)
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      useAuthStore.setState({ user: session.user, loading: false });
      useAuthStore.getState().refreshTier();
    } else {
      useAuthStore.setState({ user: null, tier: 'free', loading: false });
    }
  });
}

initAuth();
