import { Link } from 'react-router-dom';
import styles from './DashboardToolbar.module.css';

interface DashboardToolbarProps {
  onNewScript: () => void;
  creating: boolean;
}

export function DashboardToolbar({ onNewScript, creating }: DashboardToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <h1 className={styles.title}>My Scripts</h1>
      <nav className={styles.nav}>
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
      <button
        className={styles.newScriptBtn}
        onClick={onNewScript}
        disabled={creating}
        aria-label="Create new script"
      >
        + New Script
      </button>
    </div>
  );
}
