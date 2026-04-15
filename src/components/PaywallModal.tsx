import { useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { SubscriptionRepository } from '@/repositories/SubscriptionRepository';
import type { Tier } from '@/types/subscription';
import styles from './PaywallModal.module.css';

const subscriptionRepo = new SubscriptionRepository();

type CellValue = boolean | string;

interface FeatureRow {
  label: string;
  free: CellValue;
  writer: CellValue;
  pro: CellValue;
}

const FEATURES: FeatureRow[] = [
  { label: 'Scripts',          free: '3',      writer: 'Unlimited', pro: 'Unlimited' },
  { label: 'Cloud Sync',      free: false,     writer: true,        pro: true },
  { label: 'PDF Export',       free: true,      writer: true,        pro: true },
  { label: 'FDX Export',       free: false,     writer: true,        pro: true },
  { label: 'Fountain Export',  free: false,     writer: true,        pro: true },
  { label: 'Beat Sheets',     free: '3-Act',   writer: 'All',       pro: 'All' },
  { label: 'Version History', free: '5',       writer: 'Unlimited', pro: 'Unlimited' },
  { label: 'Ad-Free',         free: false,     writer: true,        pro: true },
  { label: 'Priority Support', free: false,    writer: false,       pro: true },
];

const TIERS: { key: Tier; name: string; price: string }[] = [
  { key: 'free',   name: 'Free',   price: 'Free' },
  { key: 'writer', name: 'Writer', price: '$6.99/mo' },
  { key: 'pro',    name: 'Pro',    price: '$13.99/mo' },
];

function CellContent({ value }: { value: CellValue }) {
  if (value === true)  return <span className={styles.check} aria-label="Included">✓</span>;
  if (value === false) return <span className={styles.cross} aria-label="Not included">✗</span>;
  return <span className={styles.cellText}>{value}</span>;
}

export function PaywallModal() {
  const visible = useUIStore((s) => s.paywallModalVisible);
  const hidePaywallModal = useUIStore((s) => s.hidePaywallModal);
  const user = useAuthStore((s) => s.user);
  const currentTier = useAuthStore((s) => s.tier);
  const [loading, setLoading] = useState<Tier | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!visible) return null;

  const handleUpgrade = async (tier: 'writer' | 'pro') => {
    if (!user) return;
    setLoading(tier);
    setError(null);

    try {
      const checkoutUrl = await subscriptionRepo.createCheckoutSession(user.id, tier);
      window.location.href = checkoutUrl;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Checkout failed. Please try again.';
      setError(message);
      setLoading(null);
    }
  };

  const handleClose = () => {
    setError(null);
    setLoading(null);
    hidePaywallModal();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const colClass = (tier: Tier) => (tier === currentTier ? styles.highlightCol : undefined);

  return (
    <div className={styles.overlay} onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-label="Upgrade your plan">
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
          ✕
        </button>

        <h2 className={styles.heading}>Upgrade Your Plan</h2>
        <p className={styles.subheading}>
          Unlock more features to supercharge your screenwriting workflow.
        </p>

        <div className={styles.tableWrap}>
          <table className={styles.comparisonTable}>
            <thead>
              <tr>
                <th>Feature</th>
                {TIERS.map((t) => (
                  <th key={t.key} className={colClass(t.key)}>
                    <span className={styles.tierHeaderName}>{t.name}</span>
                    <span className={t.key === 'free' ? styles.tierHeaderPrice : styles.tierHeaderPriceAccent}>
                      {t.price}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td className={colClass('free')}><CellContent value={row.free} /></td>
                  <td className={colClass('writer')}><CellContent value={row.writer} /></td>
                  <td className={colClass('pro')}><CellContent value={row.pro} /></td>
                </tr>
              ))}
              <tr className={styles.footerRow}>
                <td />
                <td className={colClass('free')}>
                  {currentTier === 'free' && <span className={styles.currentBadge}>Current plan</span>}
                </td>
                <td className={colClass('writer')}>
                  {currentTier === 'writer' ? (
                    <span className={styles.currentBadge}>Current plan</span>
                  ) : (
                    <button
                      className={styles.upgradeBtn}
                      disabled={loading !== null}
                      onClick={() => handleUpgrade('writer')}
                    >
                      {loading === 'writer' ? 'Redirecting…' : 'Upgrade'}
                    </button>
                  )}
                </td>
                <td className={colClass('pro')}>
                  {currentTier === 'pro' ? (
                    <span className={styles.currentBadge}>Current plan</span>
                  ) : (
                    <button
                      className={styles.upgradeBtn}
                      disabled={loading !== null}
                      onClick={() => handleUpgrade('pro')}
                    >
                      {loading === 'pro' ? 'Redirecting…' : 'Upgrade'}
                    </button>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}
      </div>
    </div>
  );
}
