import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { isAdmin } from '@/services/adminAccess';
import { supabase, hasSupabase } from '@/lib/supabase';
import styles from './DashboardToolbar.module.css';

interface DashboardToolbarProps {
  onNewScript?: () => void;
  creating?: boolean;
}

export function DashboardToolbar({ onNewScript, creating = false }: DashboardToolbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [showAdmin, setShowAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const adminEmails = import.meta.env.VITE_ADMIN_EMAILS as string | undefined;

    Promise.resolve().then(async () => {
      if (!user) {
        if (!cancelled) setShowAdmin(false);
        return;
      }

      if (isAdmin(user.email, null, adminEmails)) {
        if (!cancelled) setShowAdmin(true);
        return;
      }

      if (!hasSupabase) {
        if (!cancelled) setShowAdmin(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('sw_user_profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (!cancelled) setShowAdmin(isAdmin(user.email, data?.role ?? null, adminEmails));
      } catch {
        if (!cancelled) setShowAdmin(false);
      }
    });

    return () => { cancelled = true; };
  }, [user]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const handleLogout = useCallback(async () => {
    setMenuOpen(false);
    try { await signOut(); navigate('/login'); } catch { /* silent */ }
  }, [signOut, navigate]);

  const userInitial = user?.email ? user.email[0].toUpperCase() : 'U';

  const isActive = useCallback(
    (path: string) => (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)),
    [location.pathname],
  );

  const navClass = useCallback(
    (path: string) => (isActive(path) ? styles.navLinkActive : styles.navLink),
    [isActive],
  );

  const bottomNavItems = [
    { to: '/', icon: 'S', label: 'Scripts' },
    { to: '/moodboard', icon: 'M', label: 'Mood' },
    { to: '/agreements', icon: 'A', label: 'Agreements' },
    { to: '/learn', icon: 'L', label: 'Learn' },
    { to: '/settings', icon: 'U', label: 'You' },
  ];

  return (
    <>
      <div className={styles.toolbar}>
        <Link to="/" className={styles.logo} aria-label="NexWriter dashboard">
          Nex<span className={styles.logoAccent}>Writer</span>
        </Link>
        <nav className={styles.nav}>
          <Link to="/" className={navClass('/')}>
            Dashboard
          </Link>
          <Link to="/moodboard" className={navClass('/moodboard')}>Mood Board</Link>
          <Link to="/agreements" className={navClass('/agreements')}>Agreements</Link>
          <Link to="/learn" className={navClass('/learn')}>Learn</Link>
        </nav>
        <div className={styles.actions}>
          {onNewScript && (
            <button
              className={styles.newScriptBtn}
              onClick={onNewScript}
              disabled={creating}
              aria-label="Create new script"
            >
              New Script
            </button>
          )}

          {/* User avatar with dropdown menu */}
          <div className={styles.avatarWrap} ref={menuRef}>
            <button
              className={styles.userAvatar}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="User menu"
              aria-expanded={menuOpen}
              type="button"
            >
              {userInitial}
            </button>
            {menuOpen && (
              <div className={styles.userMenu}>
                {user?.email && (
                  <div className={styles.menuEmail}>{user.email}</div>
                )}
                <Link to="/settings" className={styles.menuItem} onClick={() => setMenuOpen(false)}>
                  Settings
                </Link>
                {showAdmin && (
                  <Link to="/admin" className={styles.menuItem} onClick={() => setMenuOpen(false)}>
                    Admin Panel
                  </Link>
                )}
                <Link to="/credits" className={styles.menuItem} onClick={() => setMenuOpen(false)}>
                  Credits
                </Link>
                <button type="button" className={styles.menuItemDanger} onClick={handleLogout}>
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav className={styles.bottomNav} aria-label="Mobile navigation">
        {bottomNavItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={isActive(item.to) ? styles.bottomNavLinkActive : styles.bottomNavLink}
          >
            <span className={styles.bottomNavIcon}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
