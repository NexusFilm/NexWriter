import type { FeatureKey } from '@/types/productionTools';
import { useFeatureFlagStore } from '@/stores/featureFlagStore';
import styles from './FeatureGate.module.css';

interface FeatureGateProps {
  feature: FeatureKey;
  children: React.ReactNode;
}

const FEATURE_LABELS: Record<FeatureKey, { title: string; description: string }> = {
  shot_lists: {
    title: 'Shot List Builder',
    description: 'Plan your camera work with detailed shot lists linked to your scenes.',
  },
  agreements: {
    title: 'Agreement Manager',
    description: 'Manage model releases, location releases, and crew deal memos with digital signatures.',
  },
  lighting_diagrams: {
    title: 'Lighting Diagram Tool',
    description: 'Create per-scene lighting setup diagrams with a drag-and-drop canvas editor.',
  },
  mood_boards: {
    title: 'Mood Board',
    description: 'Search TMDB for movie stills and backdrops to build visual reference collections.',
  },
  stripe_payments: {
    title: 'Premium Plans',
    description: 'Subscription plans with additional features are on the way.',
  },
};

/**
 * Wraps a route or component. If the feature flag is disabled,
 * renders a "Coming Soon" placeholder instead of the children.
 */
export function FeatureGate({ feature, children }: FeatureGateProps) {
  const isEnabled = useFeatureFlagStore((s) => s.flags[feature] ?? true);

  if (isEnabled) {
    return <>{children}</>;
  }

  const { title, description } = FEATURE_LABELS[feature];

  return (
    <div className={styles.container} role="status" aria-label={`${title} coming soon`}>
      <h2 className={styles.title}>Coming Soon</h2>
      <h3 className={styles.featureName}>{title}</h3>
      <p className={styles.description}>{description}</p>
    </div>
  );
}
