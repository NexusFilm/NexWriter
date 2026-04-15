import { describe, it, expect } from 'vitest';
import { isAccountLocked } from './lockedAccount';

describe('isAccountLocked', () => {
  it('returns true when lockedAt is a date string', () => {
    expect(isAccountLocked('2024-06-01T00:00:00Z')).toBe(true);
  });

  it('returns false when lockedAt is null', () => {
    expect(isAccountLocked(null)).toBe(false);
  });

  it('returns false when lockedAt is undefined', () => {
    expect(isAccountLocked(undefined)).toBe(false);
  });
});
