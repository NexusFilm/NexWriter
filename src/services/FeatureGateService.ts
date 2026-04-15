import { FeatureFlagRepository } from '@/repositories/FeatureFlagRepository';
import { useFeatureFlagStore } from '@/stores/featureFlagStore';
import type { FeatureKey, IFeatureGateService, FeatureFlag } from '@/types/productionTools';

/**
 * All known feature keys. Used for fail-open behaviour:
 * if flag loading fails, every feature defaults to enabled.
 */
const ALL_FEATURE_KEYS: FeatureKey[] = [
  'shot_lists',
  'agreements',
  'lighting_diagrams',
  'mood_boards',
  'stripe_payments',
];

export class FeatureGateService implements IFeatureGateService {
  private repository: FeatureFlagRepository;

  constructor(repository?: FeatureFlagRepository) {
    this.repository = repository ?? new FeatureFlagRepository();
  }

  async initialize(): Promise<void> {
    try {
      const flags = await this.repository.getAllFlags();
      useFeatureFlagStore.getState().setFlags(flags);
    } catch {
      // Fail-open: default all features to enabled so the app remains usable
      const fallbackFlags: FeatureFlag[] = ALL_FEATURE_KEYS.map((key) => ({
        id: `fallback-${key}`,
        featureKey: key,
        featureLabel: key,
        isEnabled: true,
        updatedAt: new Date().toISOString(),
      }));
      useFeatureFlagStore.getState().setFlags(fallbackFlags);
    }
  }

  isFeatureEnabled(featureKey: FeatureKey): boolean {
    return useFeatureFlagStore.getState().isEnabled(featureKey);
  }
}
