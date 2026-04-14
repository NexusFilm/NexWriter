import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { ScriptRepository } from '@/repositories/ScriptRepository';
import type { ScriptVersion } from '@/types/screenplay';
import type { Tier } from '@/types/subscription';
import styles from './VersionHistoryPage.module.css';

const scriptRepo = new ScriptRepository();

/**
 * Pure function: returns accessible versions based on tier.
 * Free tier sees max 5 most recent (versions are assumed sorted by createdAt desc).
 * Paid tiers see all versions.
 */
export function getAccessibleVersions(
  versions: ScriptVersion[],
  tier: Tier,
): ScriptVersion[] {
  if (tier === 'writer' || tier === 'pro') {
    return versions;
  }
  // Free tier: only the 5 most recent
  // Sort descending by createdAt to ensure we pick the most recent
  const sorted = [...versions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return sorted.slice(0, 5);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function VersionHistoryPage() {
  const { scriptId } = useParams<{ scriptId: string }>();
  const navigate = useNavigate();
  const tier = useAuthStore((s) => s.tier);
  const showPaywallModal = useUIStore((s) => s.showPaywallModal);

  const [allVersions, setAllVersions] = useState<ScriptVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<ScriptVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (!scriptId) return;
    let cancelled = false;

    async function load() {
      try {
        const versions = await scriptRepo.getVersions(scriptId!);
        if (cancelled) return;
        setAllVersions(versions);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load versions');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [scriptId]);

  const accessible = getAccessibleVersions(allVersions, tier);
  const accessibleIds = new Set(accessible.map((v) => v.id));

  const handleVersionClick = useCallback(
    (version: ScriptVersion) => {
      if (!accessibleIds.has(version.id)) {
        showPaywallModal();
        return;
      }
      setSelectedVersion(version);
    },
    [accessibleIds, showPaywallModal],
  );

  const handleRestore = useCallback(async () => {
    if (!scriptId || !selectedVersion) return;
    setRestoring(true);
    try {
      await scriptRepo.restoreVersion(scriptId, selectedVersion.id);
      navigate(`/editor/${scriptId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore version');
      setRestoring(false);
    }
  }, [scriptId, selectedVersion, navigate]);

  if (loading) {
    return <div className={styles.loading}>Loading version history…</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() => navigate(scriptId ? `/editor/${scriptId}` : '/')}
          type="button"
        >
          ← Back
        </button>
        <h1 className={styles.title}>Version History</h1>
      </div>
      <div className={styles.body}>
        <div className={styles.versionList}>
          {allVersions.map((version) => {
            const isAccessible = accessibleIds.has(version.id);
            const isActive = selectedVersion?.id === version.id;

            const entryClass = !isAccessible
              ? styles.lockedEntry
              : isActive
                ? styles.versionEntryActive
                : styles.versionEntry;

            return (
              <button
                key={version.id}
                className={entryClass}
                onClick={() => handleVersionClick(version)}
                type="button"
              >
                <span className={styles.versionDate}>{formatDate(version.createdAt)}</span>
                <span className={styles.versionTime}>
                  {formatTime(version.createdAt)}
                  {!isAccessible && <span className={styles.lockBadge}> 🔒</span>}
                </span>
              </button>
            );
          })}
        </div>
        <div className={styles.preview}>
          {!selectedVersion ? (
            <div className={styles.previewPlaceholder}>
              Select a version to preview
            </div>
          ) : (
            <>
              <div className={styles.previewHeader}>
                <p className={styles.previewTitle}>
                  {formatDate(selectedVersion.createdAt)} at{' '}
                  {formatTime(selectedVersion.createdAt)}
                </p>
                <button
                  className={styles.restoreBtn}
                  onClick={handleRestore}
                  disabled={restoring}
                  type="button"
                >
                  {restoring ? 'Restoring…' : 'Restore'}
                </button>
              </div>
              <div className={styles.elementList}>
                {selectedVersion.elements.map((el) => (
                  <div key={el.id} className={styles.elementItem}>
                    <span className={styles.elementType}>{el.type}</span>
                    {el.text}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
