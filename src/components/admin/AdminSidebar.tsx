import { useState, useCallback } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import styles from './AdminSidebar.module.css';

const adminLinks = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/users', label: 'Users', end: false },
  { to: '/admin/flags', label: 'Feature Flags', end: false },
  { to: '/admin/blog', label: 'Blog Posts', end: false },
];

export function AdminSidebar() {
  const [open, setOpen] = useState(false);

  const closeSidebar = useCallback(() => setOpen(false), []);

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.toggleBtn}
        onClick={() => setOpen((v) => !v)}
        type="button"
        aria-label="Toggle admin menu"
      >
        ☰ Admin
      </button>

      <div
        className={`${styles.overlay} ${open ? styles.overlayVisible : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      <nav
        className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`}
        aria-label="Admin navigation"
      >
        <span className={styles.sidebarTitle}>Admin</span>
        {adminLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              isActive ? styles.navLinkActive : styles.navLink
            }
            onClick={closeSidebar}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}
