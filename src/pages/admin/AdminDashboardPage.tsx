import { useState, useEffect } from 'react';
import { AdminRepository } from '@/repositories/AdminRepository';
import { useAdminStore } from '@/stores/adminStore';
import styles from './AdminDashboardPage.module.css';

const adminRepo = new AdminRepository();

export function AdminDashboardPage() {
  const metrics = useAdminStore((s) => s.metrics);
  const setMetrics = useAdminStore((s) => s.setMetrics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const [totalUsers, totalScripts, activeUsers7d] = await Promise.all([
          adminRepo.getTotalUsers(),
          adminRepo.getTotalScripts(),
          adminRepo.getActiveUsersLast7Days(),
        ]);
        setMetrics({ totalUsers, totalScripts, activeUsers7d });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, [setMetrics]);

  if (loading) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Admin Dashboard</h1>
        <div className={styles.loading}>Loading metrics…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Admin Dashboard</h1>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Admin Dashboard</h1>
      <div className={styles.metricsGrid}>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Total Users</span>
          <span className={styles.cardValue}>{metrics?.totalUsers ?? 0}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Total Scripts</span>
          <span className={styles.cardValue}>{metrics?.totalScripts ?? 0}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Active Users (7d)</span>
          <span className={styles.cardValue}>{metrics?.activeUsers7d ?? 0}</span>
        </div>
      </div>
    </div>
  );
}
