import { useState, useEffect, useCallback } from 'react';
import { AdminRepository } from '@/repositories/AdminRepository';
import { useAdminStore } from '@/stores/adminStore';
import styles from './AdminUsersPage.module.css';

const adminRepo = new AdminRepository();
const PAGE_SIZE = 20;

export function AdminUsersPage() {
  const users = useAdminStore((s) => s.users);
  const userTotal = useAdminStore((s) => s.userTotal);
  const userPage = useAdminStore((s) => s.userPage);
  const setUsers = useAdminStore((s) => s.setUsers);
  const setUserPage = useAdminStore((s) => s.setUserPage);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const result = await adminRepo.getUsers(page - 1, PAGE_SIZE);
      setUsers(result.users, result.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [setUsers]);

  useEffect(() => {
    fetchUsers(userPage);
  }, [userPage, fetchUsers]);

  const handleLock = useCallback(async (userId: string) => {
    try {
      await adminRepo.lockUser(userId);
      await fetchUsers(userPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lock user');
    }
  }, [userPage, fetchUsers]);

  const handleUnlock = useCallback(async (userId: string) => {
    try {
      await adminRepo.unlockUser(userId);
      await fetchUsers(userPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock user');
    }
  }, [userPage, fetchUsers]);

  const totalPages = Math.max(1, Math.ceil(userTotal / PAGE_SIZE));

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>User Management</h1>
      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Loading users…</div>
      ) : (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Display Name</th>
                <th>Tier</th>
                <th>Scripts</th>
                <th>Created</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.displayName ?? '—'}</td>
                  <td>{user.tier}</td>
                  <td>{user.scriptCount}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    {user.lockedAt ? (
                      <span className={styles.locked}>Locked</span>
                    ) : (
                      <span className={styles.active}>Active</span>
                    )}
                  </td>
                  <td>
                    {user.lockedAt ? (
                      <button
                        className={styles.unlockBtn}
                        onClick={() => handleUnlock(user.id)}
                        type="button"
                      >
                        Unlock
                      </button>
                    ) : (
                      <button
                        className={styles.lockBtn}
                        onClick={() => handleLock(user.id)}
                        type="button"
                      >
                        Lock
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              disabled={userPage <= 1}
              onClick={() => setUserPage(userPage - 1)}
              type="button"
            >
              Previous
            </button>
            <span className={styles.pageInfo}>
              Page {userPage} of {totalPages}
            </span>
            <button
              className={styles.pageBtn}
              disabled={userPage >= totalPages}
              onClick={() => setUserPage(userPage + 1)}
              type="button"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
