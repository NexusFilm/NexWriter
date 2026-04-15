import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '@/types/errors';

const fakeUser = {
  id: 'user-123',
  email: 'test@example.com',
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {},
};

const {
  mockSignIn,
  mockSignUp,
  mockSignInWithProvider,
  mockSignOut,
  mockFrom,
  mockSelect,
  mockEq,
  mockSingle,
  mockMaybeSingle,
} = vi.hoisted(() => {
  const mockMaybeSingle = vi.fn();
  const mockSingle = vi.fn();
  const mockUpsert = vi.fn().mockResolvedValue({ data: null, error: null });
  const mockEq = vi.fn(() => ({ single: mockSingle, maybeSingle: mockMaybeSingle }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));
  const mockFrom = vi.fn(() => ({ select: mockSelect, upsert: mockUpsert }));
  return {
    mockSignIn: vi.fn(),
    mockSignUp: vi.fn(),
    mockSignInWithProvider: vi.fn(),
    mockSignOut: vi.fn(),
    mockFrom,
    mockSelect,
    mockEq,
    mockSingle,
    mockMaybeSingle,
  };
});

vi.mock('@/repositories/AuthRepository', () => ({
  AuthRepository: class {
    signIn = mockSignIn;
    signUp = mockSignUp;
    signInWithProvider = mockSignInWithProvider;
    signOut = mockSignOut;
  },
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
  hasSupabase: false,
}));

import { useAuthStore } from './authStore';

describe('AuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, tier: 'free', loading: true });
    mockMaybeSingle.mockResolvedValue({ data: { tier: 'free' }, error: null });
  });

  describe('initial state', () => {
    it('has null user, free tier, and loading true', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.tier).toBe('free');
      expect(state.loading).toBe(true);
    });
  });

  describe('signIn', () => {
    it('sets user and calls refreshTier on success', async () => {
      mockSignIn.mockResolvedValue(fakeUser);
      mockMaybeSingle.mockResolvedValue({ data: { tier: 'writer' }, error: null });

      await useAuthStore.getState().signIn('test@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(fakeUser);
      expect(state.tier).toBe('writer');
      expect(state.loading).toBe(false);
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('resets loading and rethrows on failure', async () => {
      const error = new AppError('fail', 'AUTH_INVALID_CREDENTIALS', 'Invalid credentials');
      mockSignIn.mockRejectedValue(error);

      await expect(
        useAuthStore.getState().signIn('test@example.com', 'wrong'),
      ).rejects.toThrow(AppError);

      expect(useAuthStore.getState().loading).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('signInWithProvider', () => {
    it('delegates to authRepo.signInWithProvider', async () => {
      mockSignInWithProvider.mockResolvedValue(undefined);

      await useAuthStore.getState().signInWithProvider('google');

      expect(mockSignInWithProvider).toHaveBeenCalledWith('google');
    });
  });

  describe('signUp', () => {
    it('sets user with free tier on success', async () => {
      mockSignUp.mockResolvedValue(fakeUser);

      await useAuthStore.getState().signUp('test@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(fakeUser);
      expect(state.tier).toBe('free');
      expect(state.loading).toBe(false);
    });

    it('resets loading and rethrows on failure', async () => {
      const error = new AppError('fail', 'AUTH_INVALID_CREDENTIALS', 'Signup failed');
      mockSignUp.mockRejectedValue(error);

      await expect(
        useAuthStore.getState().signUp('test@example.com', 'pw'),
      ).rejects.toThrow(AppError);

      expect(useAuthStore.getState().loading).toBe(false);
    });
  });

  describe('signOut', () => {
    it('resets user to null and tier to free', async () => {
      useAuthStore.setState({ user: fakeUser as any, tier: 'pro', loading: false });
      mockSignOut.mockResolvedValue(undefined);

      await useAuthStore.getState().signOut();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.tier).toBe('free');
    });
  });

  describe('refreshTier', () => {
    it('fetches tier from sw_user_profiles for current user', async () => {
      useAuthStore.setState({ user: fakeUser as any, tier: 'free', loading: false });
      mockMaybeSingle.mockResolvedValue({ data: { tier: 'pro' }, error: null });

      await useAuthStore.getState().refreshTier();

      expect(mockFrom).toHaveBeenCalledWith('sw_user_profiles');
      expect(mockSelect).toHaveBeenCalledWith('tier');
      expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
      expect(useAuthStore.getState().tier).toBe('pro');
    });

    it('does nothing when no user is set', async () => {
      useAuthStore.setState({ user: null, tier: 'free', loading: false });

      await useAuthStore.getState().refreshTier();

      expect(mockFrom).not.toHaveBeenCalled();
      expect(useAuthStore.getState().tier).toBe('free');
    });

    it('defaults to free tier on error', async () => {
      useAuthStore.setState({ user: fakeUser as any, tier: 'writer', loading: false });
      mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } });

      await useAuthStore.getState().refreshTier();

      expect(useAuthStore.getState().tier).toBe('free');
    });
  });
});
