import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeatureGate } from './FeatureGate';

let mockFlags: Record<string, boolean> = {};

vi.mock('@/stores/featureFlagStore', () => ({
  useFeatureFlagStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ flags: mockFlags }),
}));

describe('FeatureGate', () => {
  it('renders children when feature is enabled', () => {
    mockFlags = { shot_lists: true };
    render(
      <FeatureGate feature="shot_lists">
        <div>Shot List Content</div>
      </FeatureGate>,
    );
    expect(screen.getByText('Shot List Content')).toBeInTheDocument();
  });

  it('renders Coming Soon placeholder when feature is disabled', () => {
    mockFlags = { shot_lists: false };
    render(
      <FeatureGate feature="shot_lists">
        <div>Shot List Content</div>
      </FeatureGate>,
    );
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    expect(screen.getByText('Shot List Builder')).toBeInTheDocument();
    expect(screen.queryByText('Shot List Content')).not.toBeInTheDocument();
  });

  it('renders children when feature key is absent from flags (default enabled)', () => {
    mockFlags = {};
    render(
      <FeatureGate feature="agreements">
        <div>Agreements Content</div>
      </FeatureGate>,
    );
    expect(screen.getByText('Agreements Content')).toBeInTheDocument();
  });

  it('shows the correct description for each feature', () => {
    mockFlags = { lighting_diagrams: false };
    render(
      <FeatureGate feature="lighting_diagrams">
        <div>Lighting</div>
      </FeatureGate>,
    );
    expect(
      screen.getByText(/drag-and-drop canvas editor/i),
    ).toBeInTheDocument();
  });

  it('has an accessible status role with feature name', () => {
    mockFlags = { mood_boards: false };
    render(
      <FeatureGate feature="mood_boards">
        <div>Mood Board</div>
      </FeatureGate>,
    );
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'Mood Board coming soon',
    );
  });
});
