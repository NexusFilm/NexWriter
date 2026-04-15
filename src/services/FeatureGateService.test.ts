import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeatureGateService } from './FeatureGateService';
import { useFeatureFlagStore } from '@/stores/featureFlagStore';
import type { FeatureFlag } from '@/types/productionTools';

// Reset the store before each test
beforeEach(() => {
  useFeatureFlagStore.setState({ flags: {} as any, loaded: false });
});

function makeFlag(key: string, enabled: boolean): FeatureFlag {
  return {
    id: `id-${key}`,
    featureKey: key as any,
    featureLabel: key,
    isEnabled: enabled,
    updatedAt: new Date().toISOString(),
  };
}

describe('FeatureGateService', () => {
  it('initialize() populates the store with fetched flags', async () => {
    const mockRepo = {
      getAllFlags: vi.fn().mockResolvedValue([
        makeFlag('shot_lists', true),
        makeFlag('agreements', false),
      ]),
      updateFlag: vi.fn(),
    };

    const service = new FeatureGateService(mockRepo as any);
    await service.initialize();

    const state = useFeatureFlagStore.getState();
    expect(state.loaded).toBe(true);
    expect(state.flags.shot_lists).toBe(true);
    expect(state.flags.agreements).toBe(false);
  });

  it('initialize() fail-open: sets all features enabled on error', async () => {
    const mockRepo = {
      getAllFlags: vi.fn().mockRejectedValue(new Error('network error')),
      updateFlag: vi.fn(),
    };

    const service = new FeatureGateService(mockRepo as any);
    await service.initialize();

    const state = useFeatureFlagStore.getState();
    expect(state.loaded).toBe(true);
    expect(state.flags.shot_lists).toBe(true);
    expect(state.flags.agreements).toBe(true);
    expect(state.flags.lighting_diagrams).toBe(true);
    expect(state.flags.mood_boards).toBe(true);
    expect(state.flags.stripe_payments).toBe(true);
  });

  it('isFeatureEnabled() returns stored value', async () => {
    const mockRepo = {
      getAllFlags: vi.fn().mockResolvedValue([
        makeFlag('shot_lists', true),
        makeFlag('agreements', false),
      ]),
      updateFlag: vi.fn(),
    };

    const service = new FeatureGateService(mockRepo as any);
    await service.initialize();

    expect(service.isFeatureEnabled('shot_lists')).toBe(true);
    expect(service.isFeatureEnabled('agreements')).toBe(false);
  });

  it('isFeatureEnabled() returns false for unknown key', async () => {
    const mockRepo = {
      getAllFlags: vi.fn().mockResolvedValue([]),
      updateFlag: vi.fn(),
    };

    const service = new FeatureGateService(mockRepo as any);
    await service.initialize();

    expect(service.isFeatureEnabled('shot_lists')).toBe(false);
  });
});
