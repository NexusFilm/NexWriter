import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { ScriptRepository } from '@/repositories/ScriptRepository';
import { TierGateService } from '@/services/TierGateService';
import { DashboardToolbar } from '@/components/dashboard/DashboardToolbar';
import { ScriptCardGrid } from '@/components/dashboard/ScriptCardGrid';
import type { Script } from '@/types/screenplay';
import styles from './DashboardPage.module.css';

const scriptRepo = new ScriptRepository();
const tierGate = new TierGateService();

export function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const showPaywallModal = useUIStore((s) => s.showPaywallModal);

  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchScripts = useCallback(async () => {
    if (!user) return;
    try {
      const data = await scriptRepo.getScripts(user.id);
      setScripts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scripts');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchScripts();
  }, [fetchScripts]);

  const handleNewScript = useCallback(async () => {
    if (!user || creating) return;
    setCreating(true);
    try {
      const allowed = await tierGate.canCreateScript(user.id);
      if (!allowed) {
        showPaywallModal();
        return;
      }
      const script = await scriptRepo.createScript(user.id, 'Untitled Script');
      navigate(`/editor/${script.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create script');
    } finally {
      setCreating(false);
    }
  }, [user, creating, navigate, showPaywallModal]);

  const handleNavigate = useCallback(
    (scriptId: string) => {
      navigate(`/editor/${scriptId}`);
    },
    [navigate],
  );

  const handleRename = useCallback(
    async (scriptId: string, newTitle: string) => {
      await scriptRepo.updateScript(scriptId, { title: newTitle });
      setScripts((prev) =>
        prev.map((s) => (s.id === scriptId ? { ...s, title: newTitle } : s)),
      );
    },
    [],
  );

  const handleDuplicate = useCallback(
    async (scriptId: string) => {
      await scriptRepo.duplicateScript(scriptId);
      await fetchScripts();
    },
    [fetchScripts],
  );

  const handleDelete = useCallback(
    async (scriptId: string) => {
      await scriptRepo.deleteScript(scriptId);
      setScripts((prev) => prev.filter((s) => s.id !== scriptId));
    },
    [],
  );

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading scripts…</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <DashboardToolbar onNewScript={handleNewScript} creating={creating} />
      {error && <div className={styles.error}>{error}</div>}
      {scripts.length === 0 && !error ? (
        <div className={styles.empty}>
          <span>No scripts yet. Click "New Script" to get started.</span>
        </div>
      ) : (
        <ScriptCardGrid
          scripts={scripts}
          onNavigate={handleNavigate}
          onRename={handleRename}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
