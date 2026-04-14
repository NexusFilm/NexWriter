import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const hasSupabase = Boolean(supabaseUrl && supabaseAnonKey);

const supabaseInstance: SupabaseClient | null = hasSupabase
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Lazy Supabase client proxy. Accessing any property on this object
 * will throw if Supabase is not configured, but won't throw at import time.
 * This lets the app load and show the login page even without env vars.
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!supabaseInstance) {
      throw new Error('Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }
    const value = (supabaseInstance as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return value.bind(supabaseInstance);
    }
    return value;
  },
});
