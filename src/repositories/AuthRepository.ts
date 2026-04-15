import { supabase } from '@/lib/supabase';
import { AppError } from '@/types/errors';
import { isAccountLocked } from '@/services/lockedAccount';
import type { User, Session } from '@/types/auth';
import type { IAuthRepository } from '@/types/repositories';

const DEFAULT_SITE_URL = 'https://nexwriter.vercel.app';

function normalizeRedirectUrl(url: string): string {
  return `${url.replace(/\/+$/, '')}/`;
}

function isLocalOrigin(origin: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

function getOAuthRedirectUrl(): string {
  if (isLocalOrigin(window.location.origin)) {
    return normalizeRedirectUrl(window.location.origin);
  }

  const configuredSiteUrl = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim();
  return normalizeRedirectUrl(configuredSiteUrl || DEFAULT_SITE_URL);
}

export class AuthRepository implements IAuthRepository {
  async signUp(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      throw new AppError(
        error.message,
        'AUTH_INVALID_CREDENTIALS',
        'Unable to create account. Please check your details and try again.',
      );
    }

    if (!data.user) {
      throw new AppError(
        'Sign-up succeeded but no user returned',
        'UNKNOWN_ERROR',
        'Something went wrong during sign-up. Please try again.',
      );
    }

    return data.user;
  }

  async signIn(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new AppError(
        error.message,
        'AUTH_INVALID_CREDENTIALS',
        'Invalid email or password. Please try again.',
      );
    }

    if (!data.user) {
      throw new AppError(
        'Sign-in succeeded but no user returned',
        'UNKNOWN_ERROR',
        'Something went wrong during sign-in. Please try again.',
      );
    }

    // Check if the account is locked
    const { data: profile } = await supabase
      .from('sw_user_profiles')
      .select('locked_at')
      .eq('id', data.user.id)
      .single();

    if (profile && isAccountLocked(profile.locked_at)) {
      // Sign the user out since their account is locked
      await supabase.auth.signOut();
      throw new AppError(
        'Account is locked',
        'ACCOUNT_LOCKED',
        'Your account has been locked.',
      );
    }

    return data.user;
  }

  async signInWithProvider(provider: 'google' | 'github'): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getOAuthRedirectUrl(),
      },
    });

    if (error) {
      throw new AppError(
        error.message,
        'AUTH_PROVIDER_ERROR',
        `Unable to sign in with ${provider}. Please try again.`,
      );
    }
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new AppError(
        error.message,
        'UNKNOWN_ERROR',
        'Unable to sign out. Please try again.',
      );
    }
  }

  async getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw new AppError(
        error.message,
        'AUTH_SESSION_EXPIRED',
        'Unable to retrieve session. Please sign in again.',
      );
    }

    return data.session;
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });

    return () => data.subscription.unsubscribe();
  }
}
