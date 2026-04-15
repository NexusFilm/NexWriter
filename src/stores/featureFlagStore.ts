import { create } from 'zustand';
import type { FeatureFlag, FeatureKey } from '@/types/productionTools';

export interface FeatureFlagState {
  flags: Record<FeatureKey, boolean>;
  loaded: boolean;
  setFlags: (flags: FeatureFlag[]) => void;
  isEnabled: (key: FeatureKey) => boolean;
}

export const useFeatureFlagStore = create<FeatureFlagState>((set, get) => ({
  flags: {} as Record<FeatureKey, boolean>,
  loaded: false,

  setFlags: (flags: FeatureFlag[]) => {
    const flagMap = {} as Record<FeatureKey, boolean>;
    for (const flag of flags) {
      flagMap[flag.featureKey] = flag.isEnabled;
    }
    set({ flags: flagMap, loaded: true });
  },

  isEnabled: (key: FeatureKey): boolean => {
    const { flags } = get();
    return flags[key] ?? false;
  },
}));
