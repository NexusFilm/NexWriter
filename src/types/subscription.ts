export type Tier = 'free' | 'writer' | 'pro';

export type GatedFeature =
  | 'cloud_sync'
  | 'fdx_export'
  | 'fountain_export'
  | 'beat_sheet_premium'
  | 'version_history_full'
  | 'ad_free'
  | 'unlimited_scripts';

export interface SubscriptionStatus {
  tier: Tier;
  stripeCustomerId: string | null;
  active: boolean;
}
