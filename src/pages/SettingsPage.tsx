import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import styles from './SettingsPage.module.css';

export function SettingsPage() {
  const tier = useAuthStore((s) => s.tier);
  const showPaywallModal = useUIStore((s) => s.showPaywallModal);

  const isPaid = tier === 'writer' || tier === 'pro';

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.backLink}>
        ← Back to Dashboard
      </Link>
      <h1 className={styles.heading}>Settings</h1>

      <div className={styles.panel}>
        <h2 className={styles.panelHeading}>Subscription</h2>

        <div className={styles.tierRow}>
          <span className={styles.tierLabel}>Current plan</span>
          <span className={isPaid ? styles.tierBadgeAccent : styles.tierBadge}>
            {tier}
          </span>
        </div>

        {isPaid ? (
          <p className={styles.subscriptionInfo}>
            You're on the {tier} plan. Manage your billing through Stripe.
          </p>
        ) : (
          <p className={styles.subscriptionInfo}>
            You're on the free plan. Upgrade to unlock cloud sync, premium
            exports, and more.
          </p>
        )}

        <button
          className={styles.manageBtn}
          onClick={isPaid ? undefined : showPaywallModal}
        >
          {isPaid ? 'Manage Subscription' : 'Upgrade Plan'}
        </button>
      </div>
    </div>
  );
}
