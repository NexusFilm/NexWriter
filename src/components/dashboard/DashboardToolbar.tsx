import { Link, useLocation } from 'react-router-dom';
import styles from './DashboardToolbar.module.css';

interface DashboardToolbarProps {
  onNewScript: () => void;
  creating: boolean;
}

export function DashboardToolbar({ onNewScript, creating }: DashboardToolbarProps) {
  const location = useLocation();

  const bottomNavItems = [
    { to: '/', icon: '📄', label: 'Dashboard' },
    { to: '/blueprint/new', icon: '🗺️', label: 'Blueprint' },
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
          <Link to="/" className={styles.navLinkActive}>
            Dashboard
          </Link>
          <Link to="/blueprint/new" className={styles.navLink}>
            Blueprint
          </Link>
          <Link to="/learn" className={styles.navLink}>
            Learn
          </Link>
          <Link to="/settings" className={styles.navLink}>
            Settings
          </Link>
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
          <div className={styles.userAvatar} aria-label="User menu">
            U
          </div>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav className={styles.bottomNav} aria-label="Mobile navigation">
        {bottomNavItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={
              location.pathname === item.to
                ? styles.bottomNavLinkActive
                : styles.bottomNavLink
            }
          >
            <span className={styles.bottomNavIcon}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
