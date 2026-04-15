import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { isAdmin } from '@/services/adminAccess';
import { supabase, hasSupabase } from '@/lib/supabase';
import styles from './DashboardToolbar.module.css';

interface DashboardToolbarProps {
  onNewScript: () => void;
  creating: boolean;
}

export function DashboardToolbar({ onNewScript, creating }: DashboardToolbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [showAdmin, setShowAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { setShowAdmin(false); return; }
    const adminEmails = import.meta.env.VITE_ADMIN_EMAILS as string | undefined;
    if (isAdmin(user.email, null, adminEmails)) { setShowAdmin(true); return; }
    if (!hasSupabase) { setShowAdmin(false); return; }
    supabase
      .from('sw_user_profiles').select('role').eq('id', user.id).maybeSingle()
      .then(({ data }) => setShowAdmin(isAdmin(user.email, data?.role ?? null, adminEmails)))
      .catch(() => setShowAdmin(false));
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

  const bottomNavItems = [
    { to: '/', icon: '📄', label: 'Scripts' },
    { to: '/moodboard', icon: '🎬', label: 'Mood Board' },
    { to: '/agreements', icon: '📋', label: 'Agreements' },
    { to: '/learn', icon: '📚', label: 'Learn' },
    { to: '/settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <>
      <div className={styles.toolbar}>
        <span className={styles.logo}>
          Draft<span className={styles.logoAccent}>Kit</span>
        </span>
        <nav className={styles.nav}>
          <Link to="/" className={location.pathname === '/' ? styles.navLinkActive : styles.navLink}>
            Dashboard
          </Link>
          <Link to="/moodboard" className={styles.navLink}>Mood Board</Link>
          <Link to="/agreements" className={styles.navLink}>Agreements</Link>
          <Link to="/learn" className={styles.navLink}>Learn</Link>
        </nav>
        <div className={styles.actions}>
          <button
            className={styles.newScriptBtn}
            onClick={onNewScript}
            disabled={creating}
            aria-label="Create new script"
          >
            + New Script
          </button>

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
            className={location.pathname === item.to ? styles.bottomNavLinkActive : styles.bottomNavLink}
          >
            <span className={styles.bottomNavIcon}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
