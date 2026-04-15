import { describe, it, expect, beforeEach } from 'vitest';
import { useFeatureFlagStore } from './featureFlagStore';
import type { FeatureFlag } from '@/types/productionTools';

describe('FeatureFlagStore', () => {
  beforeEach(() => {
    useFeatureFlagStore.setState({
      flags: {} as Record<string, boolean>,
      loaded: false,
    });
  });

  it('starts with empty flags and loaded false', () => {
    const state = useFeatureFlagStore.getState();
    expect(state.flags).toEqual({});
    expect(state.loaded).toBe(false);
  });

  it('setFlags populates the flags map and sets loaded to true', () => {
    const flags: FeatureFlag[] = [
      { id: '1', featureKey: 'shot_lists', featureLabel: 'Shot Lists', isEnabled: true, updatedAt: '' },
      { id: '2', featureKey: 'agreements', featureLabel: 'Agreements', isEnabled: false, updatedAt: '' },
      { id: '3', featureKey: 'mood_boards', featureLabel: 'Mood Boards', isEnabled: true, updatedAt: '' },
    ];

    useFeatureFlagStore.getState().setFlags(flags);
    const state = useFeatureFlagStore.getState();

    expect(state.loaded).toBe(true);
    expect(state.flags.shot_lists).toBe(true);
    expect(state.flags.agreements).toBe(false);
    expect(state.flags.mood_boards).toBe(true);
  });

  it('isEnabled returns the stored value for a known key', () => {
    const flags: FeatureFlag[] = [
      { id: '1', featureKey: 'shot_lists', featureLabel: 'Shot Lists', isEnabled: true, updatedAt: '' },
      { id: '2', featureKey: 'agreements', featureLabel: 'Agreements', isEnabled: false, updatedAt: '' },
    ];

    useFeatureFlagStore.getState().setFlags(flags);

    expect(useFeatureFlagStore.getState().isEnabled('shot_lists')).toBe(true);
    expect(useFeatureFlagStore.getState().isEnabled('agreements')).toBe(false);
  });

  it('isEnabled returns false for an absent key', () => {
    useFeatureFlagStore.getState().setFlags([]);
    expect(useFeatureFlagStore.getState().isEnabled('lighting_diagrams')).toBe(false);
  });

  it('setFlags overwrites previous flags', () => {
    const first: FeatureFlag[] = [
      { id: '1', featureKey: 'shot_lists', featureLabel: 'Shot Lists', isEnabled: true, updatedAt: '' },
    ];
    const second: FeatureFlag[] = [
      { id: '1', featureKey: 'shot_lists', featureLabel: 'Shot Lists', isEnabled: false, updatedAt: '' },
      { id: '2', featureKey: 'stripe_payments', featureLabel: 'Stripe', isEnabled: true, updatedAt: '' },
    ];

    useFeatureFlagStore.getState().setFlags(first);
    expect(useFeatureFlagStore.getState().isEnabled('shot_lists')).toBe(true);

    useFeatureFlagStore.getState().setFlags(second);
    expect(useFeatureFlagStore.getState().isEnabled('shot_lists')).toBe(false);
    expect(useFeatureFlagStore.getState().isEnabled('stripe_payments')).toBe(true);
  });
});
