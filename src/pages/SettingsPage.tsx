import { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import styles from './SettingsPage.module.css';

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    try { await signOut(); navigate('/login'); } catch { /* silent */ }
  }, [signOut, navigate]);

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.backLink}>
        ← Back to Dashboard
      </Link>
      <h1 className={styles.heading}>Settings</h1>

      <div className={styles.panel}>
        <h2 className={styles.panelHeading}>Account</h2>
        <div className={styles.tierRow}>
          <span className={styles.tierLabel}>Email</span>
          <span className={styles.tierBadge}>{user?.email ?? '—'}</span>
        </div>
      </div>

      <div className={styles.panel} style={{ marginTop: 24 }}>
        <h2 className={styles.panelHeading}>About</h2>
        <Link to="/credits" className={styles.manageBtn} style={{ textDecoration: 'none' }}>
          Credits &amp; Attribution
        </Link>
      </div>

      <div className={styles.panel} style={{ marginTop: 24 }}>
        <button className={styles.logoutBtn} onClick={handleLogout} type="button">
          Log Out
        </button>
      </div>
    </div>
  );
}
