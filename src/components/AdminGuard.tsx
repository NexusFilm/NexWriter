import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { supabase, hasSupabase } from '@/lib/supabase';
import { isAdmin } from '@/services/adminAccess';

export function AdminGuard() {
  const user = useAuthStore((s) => s.user);
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!user) {
      setChecking(false);
      setAuthorized(false);
      return;
    }

    const adminEmails = import.meta.env.VITE_ADMIN_EMAILS as string | undefined;

    // Fast path: check email against env var list first
    if (isAdmin(user.email, null, adminEmails)) {
      setAuthorized(true);
      setChecking(false);
      return;
    }

    // Fallback: check role column in sw_user_profiles
    if (!hasSupabase) {
      setAuthorized(false);
      setChecking(false);
      return;
    }

    supabase
      .from('sw_user_profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setAuthorized(isAdmin(user.email, data?.role ?? null, adminEmails));
        setChecking(false);
      }, () => {
        setAuthorized(false);
        setChecking(false);
      });
  }, [user]);

  if (checking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading…</p>
      </div>
    );
  }

  if (!authorized) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
