import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '@/types/errors';

// Mock the supabase module before importing AuthRepository
const mockSignUp = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignInWithOAuth = vi.fn();
const mockSignOut = vi.fn();
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: (...args: unknown[]) => mockSignUp(...args),
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signInWithOAuth: (...args: unknown[]) => mockSignInWithOAuth(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
    },
  },
}));

import { AuthRepository } from './AuthRepository';

const fakeUser = {
  id: 'user-123',
  email: 'test@example.com',
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {},
};

describe('AuthRepository', () => {
  let repo: AuthRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new AuthRepository();
  });

  describe('signUp', () => {
    it('returns user on success', async () => {
      mockSignUp.mockResolvedValue({ data: { user: fakeUser }, error: null });

      const user = await repo.signUp('test@example.com', 'password123');
      expect(user).toEqual(fakeUser);
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('throws AppError on failure', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Email already registered' },
      });

      await expect(repo.signUp('test@example.com', 'pw')).rejects.toThrow(AppError);
      await expect(repo.signUp('test@example.com', 'pw')).rejects.toMatchObject({
        code: 'AUTH_INVALID_CREDENTIALS',
      });
    });

    it('throws AppError when no user returned', async () => {
      mockSignUp.mockResolvedValue({ data: { user: null }, error: null });

      await expect(repo.signUp('test@example.com', 'pw')).rejects.toThrow(AppError);
    });
  });

  describe('signIn', () => {
    it('returns user on success', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: fakeUser },
        error: null,
      });

      const user = await repo.signIn('test@example.com', 'password123');
      expect(user).toEqual(fakeUser);
    });

    it('throws AppError with AUTH_INVALID_CREDENTIALS on failure', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' },
      });

      await expect(repo.signIn('test@example.com', 'wrong')).rejects.toMatchObject({
        code: 'AUTH_INVALID_CREDENTIALS',
      });
    });
  });

  describe('signInWithProvider', () => {
    it('calls signInWithOAuth for google', async () => {
      mockSignInWithOAuth.mockResolvedValue({ error: null });

      await repo.signInWithProvider('google');
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/` },
      });
    });

    it('calls signInWithOAuth for github', async () => {
      mockSignInWithOAuth.mockResolvedValue({ error: null });

      await repo.signInWithProvider('github');
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'github',
        options: { redirectTo: `${window.location.origin}/` },
      });
    });

    it('throws AppError with AUTH_PROVIDER_ERROR on failure', async () => {
      mockSignInWithOAuth.mockResolvedValue({
        error: { message: 'Provider error' },
      });

      await expect(repo.signInWithProvider('google')).rejects.toMatchObject({
        code: 'AUTH_PROVIDER_ERROR',
      });
    });
  });

  describe('signOut', () => {
    it('resolves on success', async () => {
      mockSignOut.mockResolvedValue({ error: null });

      await expect(repo.signOut()).resolves.toBeUndefined();
    });

    it('throws AppError on failure', async () => {
      mockSignOut.mockResolvedValue({ error: { message: 'Sign out failed' } });

      await expect(repo.signOut()).rejects.toThrow(AppError);
    });
  });

  describe('getSession', () => {
    it('returns session when present', async () => {
      const fakeSession = { access_token: 'abc', user: fakeUser };
      mockGetSession.mockResolvedValue({
        data: { session: fakeSession },
        error: null,
      });

      const session = await repo.getSession();
      expect(session).toEqual(fakeSession);
    });

    it('returns null when no session', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const session = await repo.getSession();
      expect(session).toBeNull();
    });

    it('throws AppError with AUTH_SESSION_EXPIRED on error', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' },
      });

      await expect(repo.getSession()).rejects.toMatchObject({
        code: 'AUTH_SESSION_EXPIRED',
      });
    });
  });

  describe('onAuthStateChange', () => {
    it('calls callback with user on auth state change', () => {
      const unsubscribe = vi.fn();
      mockOnAuthStateChange.mockImplementation((cb: Function) => {
        // Simulate an auth state change event
        cb('SIGNED_IN', { user: fakeUser });
        return { data: { subscription: { unsubscribe } } };
      });

      const callback = vi.fn();
      repo.onAuthStateChange(callback);

      expect(callback).toHaveBeenCalledWith(fakeUser);
    });

    it('calls callback with null when session is null', () => {
      const unsubscribe = vi.fn();
      mockOnAuthStateChange.mockImplementation((cb: Function) => {
        cb('SIGNED_OUT', null);
        return { data: { subscription: { unsubscribe } } };
      });

      const callback = vi.fn();
      repo.onAuthStateChange(callback);

      expect(callback).toHaveBeenCalledWith(null);
    });

    it('returns an unsubscribe function', () => {
      const unsubscribe = vi.fn();
      mockOnAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe } },
      });

      const unsub = repo.onAuthStateChange(vi.fn());
      unsub();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });
});
