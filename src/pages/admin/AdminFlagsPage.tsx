import { useState, useEffect, useCallback } from 'react';
import { FeatureFlagRepository } from '@/repositories/FeatureFlagRepository';
import type { FeatureFlag } from '@/types/productionTools';
import styles from './AdminFlagsPage.module.css';

const flagRepo = new FeatureFlagRepository();

export function AdminFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFlags() {
      try {
        const data = await flagRepo.getAllFlags();
        setFlags(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load flags');
      } finally {
        setLoading(false);
      }
    }
    loadFlags();
  }, []);

  const handleToggle = useCallback(async (flag: FeatureFlag) => {
    const newValue = !flag.isEnabled;
    // Optimistic update
    setFlags((prev) =>
      prev.map((f) => (f.id === flag.id ? { ...f, isEnabled: newValue } : f)),
    );
    try {
      await flagRepo.updateFlag(flag.id, newValue);
    } catch (err) {
      // Revert on failure
      setFlags((prev) =>
        prev.map((f) => (f.id === flag.id ? { ...f, isEnabled: flag.isEnabled } : f)),
      );
      setError(err instanceof Error ? err.message : 'Failed to update flag');
    }
  }, []);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Feature Flags</h1>
      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Loading flags…</div>
      ) : (
        <div className={styles.flagList}>
          {flags.map((flag) => (
            <div key={flag.id} className={styles.flagRow}>
              <div className={styles.flagInfo}>
                <span className={styles.flagLabel}>{flag.featureLabel}</span>
                <span className={styles.flagKey}>{flag.featureKey}</span>
              </div>
              <button
                className={flag.isEnabled ? styles.toggleOn : styles.toggleOff}
                onClick={() => handleToggle(flag)}
                type="button"
                role="switch"
                aria-checked={flag.isEnabled}
                aria-label={`Toggle ${flag.featureLabel}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
