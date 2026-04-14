import { useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { SubscriptionRepository } from '@/repositories/SubscriptionRepository';
import type { Tier } from '@/types/subscription';
import styles from './PaywallModal.module.css';

const subscriptionRepo = new SubscriptionRepository();

interface TierInfo {
  key: Tier;
  name: string;
  price: string;
  features: string[];
}

const tiers: TierInfo[] = [
  {
    key: 'free',
    name: 'Free',
    price: 'Free',
    features: [
      '3 scripts',
      'Local autosave',
      'PDF export',
      '3-Act beat sheet',
      '5 version snapshots',
    ],
  },
  {
    key: 'writer',
    name: 'Writer',
    price: '$6.99/mo',
    features: [
      'Unlimited scripts',
      'Cloud sync',
      'PDF + FDX + Fountain export',
      'All beat sheets',
      'Full version history',
      'Ad-free',
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$13.99/mo',
    features: [
      'Everything in Writer',
      'Priority support',
    ],
  },
];

export function PaywallModal() {
  const visible = useUIStore((s) => s.paywallModalVisible);
  const hidePaywallModal = useUIStore((s) => s.hidePaywallModal);
  const user = useAuthStore((s) => s.user);
  const currentTier = useAuthStore((s) => s.tier);
  const refreshTier = useAuthStore((s) => s.refreshTier);

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

        <div className={styles.tierGrid}>
          {tiers.map((tier) => {
            const isCurrent = tier.key === currentTier;
            const isUpgrade = tier.key === 'writer' || tier.key === 'pro';
            const isHighlighted = tier.key === 'writer';

            return (
              <div
                key={tier.key}
                className={isHighlighted ? styles.tierCardHighlighted : styles.tierCard}
              >
                <h3 className={styles.tierName}>{tier.name}</h3>
                <p className={tier.key === 'free' ? styles.tierPriceFree : styles.tierPrice}>
                  {tier.price}
                </p>

                <ul className={styles.featureList}>
                  {tier.features.map((feature) => (
                    <li key={feature} className={styles.featureItem}>
                      {feature}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <button className={styles.currentBtn} disabled>
                    Current plan
                  </button>
                ) : isUpgrade ? (
                  <button
                    className={styles.upgradeBtn}
                    disabled={loading !== null}
                    onClick={() => handleUpgrade(tier.key as 'writer' | 'pro')}
                  >
                    {loading === tier.key ? 'Redirecting…' : `Upgrade to ${tier.name}`}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}
      </div>
    </div>
  );
}
