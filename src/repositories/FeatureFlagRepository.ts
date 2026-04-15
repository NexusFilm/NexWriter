import { supabase } from '@/lib/supabase';

import { AppError } from '@/types/errors';
import type { FeatureFlag, FeatureKey, IFeatureFlagRepository } from '@/types/productionTools';

interface FeatureFlagRow {
  id: string;
  feature_key: FeatureKey;
  feature_label: string;
  is_enabled: boolean;
  updated_at: string;
}

function mapFlag(row: FeatureFlagRow): FeatureFlag {
  return {
    id: row.id,
    featureKey: row.feature_key,
    featureLabel: row.feature_label,
    isEnabled: row.is_enabled,
    updatedAt: row.updated_at,
  };
}

export class FeatureFlagRepository implements IFeatureFlagRepository {
  async getAllFlags(): Promise<FeatureFlag[]> {
    const { data, error } = await supabase
      .from('sw_feature_flags')
      .select('*');

    if (error) {
      throw new AppError(
        error.message,
        'FEATURE_FLAG_LOAD_FAILED',
        'Unable to load feature flags. Please try again.',
        true,
      );
    }

    return (data as FeatureFlagRow[]).map(mapFlag);
  }

  async updateFlag(flagId: string, isEnabled: boolean): Promise<void> {
    const { error } = await supabase
      .from('sw_feature_flags')
      .update({ is_enabled: isEnabled, updated_at: new Date().toISOString() })
      .eq('id', flagId);

    if (error) {
      throw new AppError(
        error.message,
        'FEATURE_FLAG_LOAD_FAILED',
        'Unable to update feature flag. Please try again.',
        true,
      );
    }
  }
}
