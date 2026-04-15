import { supabase } from '@/lib/supabase';

import { AppError } from '@/types/errors';
import type { Tier, GatedFeature } from '@/types/subscription';
import type { ITierGateService } from '@/types/services';
import { useFeatureFlagStore } from '@/stores/featureFlagStore';

const FREE_SCRIPT_LIMIT = 3;

/**
 * Pure function for property testing — no DB dependency.
 * Returns true if the user can create a new script given their tier and current script count.
 * When stripePaymentsEnabled is false, all users get full access.
 */
export function canCreateScriptPure(tier: Tier, scriptCount: number, stripePaymentsEnabled = true): boolean {
  if (!stripePaymentsEnabled) {
    return true;
  }
  if (tier === 'writer' || tier === 'pro') {
    return true;
  }
  return scriptCount < FREE_SCRIPT_LIMIT;
}

/** Features that require a paid tier (writer or pro). */
const PAID_FEATURES: ReadonlySet<GatedFeature> = new Set<GatedFeature>([
  'cloud_sync',
  'fdx_export',
  'fountain_export',
  'beat_sheet_premium',
  'version_history_full',
  'ad_free',
  'unlimited_scripts',
]);

/**
 * Pure function for feature-access checks — no DB dependency.
 * Returns true if the given tier grants access to the feature.
 * When stripePaymentsEnabled is false, all features are accessible.
 */
export function canAccessFeaturePure(tier: Tier, feature: GatedFeature, stripePaymentsEnabled = true): boolean {
  if (!stripePaymentsEnabled) {
    return true;
  }
  if (!PAID_FEATURES.has(feature)) {
    return true;
  }
  return tier === 'writer' || tier === 'pro';
}

/**
 * Reads the stripe_payments feature flag from the FeatureFlagStore.
 */
export function isStripePaymentsEnabled(): boolean {
  return useFeatureFlagStore.getState().isEnabled('stripe_payments');
}

export class TierGateService implements ITierGateService {
  async getScriptCount(userId: string): Promise<number> {
    // First try the denormalized count on sw_user_profiles
    const { data: profile, error: profileError } = await supabase
      .from('sw_user_profiles')
      .select('script_count')
      .eq('id', userId)
      .maybeSingle();

    if (!profileError && profile && typeof profile.script_count === 'number') {
      return profile.script_count;
    }

    // Fallback: count rows in sw_scripts
    const { count, error: countError } = await supabase
      .from('sw_scripts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      throw new AppError(
        countError.message,
        'UNKNOWN_ERROR',
        'Unable to determine script count. Please try again.',
        true,
      );
    }

    return count ?? 0;
  }

  async canCreateScript(userId: string): Promise<boolean> {
    const stripeEnabled = isStripePaymentsEnabled();
    if (!stripeEnabled) {
      return true;
    }

    const tier = await this.getUserTier(userId);
    if (tier === 'writer' || tier === 'pro') {
      return true;
    }

    const scriptCount = await this.getScriptCount(userId);
    return canCreateScriptPure(tier, scriptCount, stripeEnabled);
  }

  async canAccessFeature(userId: string, feature: GatedFeature): Promise<boolean> {
    const stripeEnabled = isStripePaymentsEnabled();
    if (!stripeEnabled) {
      return true;
    }

    const tier = await this.getUserTier(userId);
    return canAccessFeaturePure(tier, feature, stripeEnabled);
  }

  private async getUserTier(userId: string): Promise<Tier> {
    const { data, error } = await supabase
      .from('sw_user_profiles')
      .select('tier')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      return 'free';
    }

    return (data.tier as Tier) ?? 'free';
  }
}
