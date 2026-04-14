import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '@/types/errors';
import { canCreateScriptPure, canAccessFeaturePure } from './TierGateService';
import type { Tier, GatedFeature } from '@/types/subscription';

// --- Pure function tests (no mocking needed) ---

describe('canCreateScriptPure', () => {
  it('returns true for writer tier regardless of script count', () => {
    expect(canCreateScriptPure('writer', 0)).toBe(true);
    expect(canCreateScriptPure('writer', 3)).toBe(true);
    expect(canCreateScriptPure('writer', 100)).toBe(true);
  });

  it('returns true for pro tier regardless of script count', () => {
    expect(canCreateScriptPure('pro', 0)).toBe(true);
    expect(canCreateScriptPure('pro', 3)).toBe(true);
    expect(canCreateScriptPure('pro', 100)).toBe(true);
  });

  it('returns true for free tier with fewer than 3 scripts', () => {
    expect(canCreateScriptPure('free', 0)).toBe(true);
    expect(canCreateScriptPure('free', 1)).toBe(true);
    expect(canCreateScriptPure('free', 2)).toBe(true);
  });

  it('returns false for free tier with 3 or more scripts', () => {
    expect(canCreateScriptPure('free', 3)).toBe(false);
    expect(canCreateScriptPure('free', 4)).toBe(false);
    expect(canCreateScriptPure('free', 100)).toBe(false);
  });
});

describe('canAccessFeaturePure', () => {
  const paidFeatures: GatedFeature[] = [
    'cloud_sync',
    'fdx_export',
    'fountain_export',
    'beat_sheet_premium',
    'version_history_full',
    'ad_free',
    'unlimited_scripts',
  ];

  it('denies all paid features for free tier', () => {
    for (const feature of paidFeatures) {
      expect(canAccessFeaturePure('free', feature)).toBe(false);
    }
  });

  it('grants all paid features for writer tier', () => {
    for (const feature of paidFeatures) {
      expect(canAccessFeaturePure('writer', feature)).toBe(true);
    }
  });

  it('grants all paid features for pro tier', () => {
    for (const feature of paidFeatures) {
      expect(canAccessFeaturePure('pro', feature)).toBe(true);
    }
  });
});

// --- TierGateService class tests (with Supabase mock) ---

// Chainable query builder mock
function createQueryMock() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const self = () => chain;

  chain.select = vi.fn().mockReturnValue(self());
  chain.insert = vi.fn().mockReturnValue(self());
  chain.update = vi.fn().mockReturnValue(self());
  chain.delete = vi.fn().mockReturnValue(self());
  chain.eq = vi.fn().mockReturnValue(self());
  chain.order = vi.fn().mockReturnValue(self());
  chain.limit = vi.fn().mockReturnValue(self());
  chain.single = vi.fn().mockResolvedValue({ data: null, error: null });

  (self() as any).then = (resolve: Function) =>
    chain.single().then((result: any) => resolve(result));

  return chain;
}

let queryMock = createQueryMock();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => {
      const self = () => queryMock;
      return {
        select: (...args: unknown[]) => { queryMock.select(...args); return self(); },
        insert: (...args: unknown[]) => { queryMock.insert(...args); return self(); },
        update: (...args: unknown[]) => { queryMock.update(...args); return self(); },
        delete: (...args: unknown[]) => { queryMock.delete(...args); return self(); },
        eq: (...args: unknown[]) => { queryMock.eq(...args); return self(); },
        order: (...args: unknown[]) => { queryMock.order(...args); return self(); },
        limit: (...args: unknown[]) => { queryMock.limit(...args); return self(); },
        single: () => queryMock.single(),
        then: (resolve: Function) => queryMock.single().then((r: any) => resolve(r)),
      };
    }),
  },
}));

import { TierGateService } from './TierGateService';

describe('TierGateService', () => {
  let service: TierGateService;

  beforeEach(() => {
    vi.clearAllMocks();
    queryMock = createQueryMock();
    service = new TierGateService();
  });

  describe('getScriptCount', () => {
    it('returns script_count from user profile when available', async () => {
      queryMock.single.mockResolvedValue({ data: { script_count: 5 }, error: null });

      const count = await service.getScriptCount('user-1');
      expect(count).toBe(5);
    });

    it('falls back to counting sw_scripts when profile query fails', async () => {
      // First call (profile) fails, second call (count) succeeds
      queryMock.single
        .mockResolvedValueOnce({ data: null, error: { message: 'Not found' } })
        .mockResolvedValueOnce({ data: null, error: null, count: 7 });

      // The fallback uses a different query pattern with count: 'exact', head: true
      // We need the chain to return count on the awaited result
      // Override the then to return count
      const origSingle = queryMock.single;
      let callCount = 0;
      queryMock.single = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ data: null, error: { message: 'Not found' } });
        }
        return Promise.resolve({ data: null, error: null, count: 7 });
      });

      const count = await service.getScriptCount('user-1');
      expect(count).toBe(7);
    });

    it('throws AppError when both queries fail', async () => {
      queryMock.single
        .mockResolvedValueOnce({ data: null, error: { message: 'Profile error' } })
        .mockResolvedValueOnce({ data: null, error: { message: 'Count error' }, count: null });

      await expect(service.getScriptCount('user-1')).rejects.toThrow(AppError);
    });
  });

  describe('canCreateScript', () => {
    it('returns true for writer tier', async () => {
      // getUserTier returns 'writer'
      queryMock.single.mockResolvedValue({ data: { tier: 'writer' }, error: null });

      const result = await service.canCreateScript('user-1');
      expect(result).toBe(true);
    });

    it('returns true for pro tier', async () => {
      queryMock.single.mockResolvedValue({ data: { tier: 'pro' }, error: null });

      const result = await service.canCreateScript('user-1');
      expect(result).toBe(true);
    });

    it('returns true for free tier with fewer than 3 scripts', async () => {
      queryMock.single
        .mockResolvedValueOnce({ data: { tier: 'free' }, error: null }) // getUserTier
        .mockResolvedValueOnce({ data: { script_count: 2 }, error: null }); // getScriptCount

      const result = await service.canCreateScript('user-1');
      expect(result).toBe(true);
    });

    it('returns false for free tier with 3 or more scripts', async () => {
      queryMock.single
        .mockResolvedValueOnce({ data: { tier: 'free' }, error: null })
        .mockResolvedValueOnce({ data: { script_count: 3 }, error: null });

      const result = await service.canCreateScript('user-1');
      expect(result).toBe(false);
    });

    it('throws AppError when tier lookup fails', async () => {
      queryMock.single.mockResolvedValue({ data: null, error: { message: 'DB error' } });

      await expect(service.canCreateScript('user-1')).rejects.toThrow(AppError);
    });
  });

  describe('canAccessFeature', () => {
    it('returns false for free tier on paid features', async () => {
      queryMock.single.mockResolvedValue({ data: { tier: 'free' }, error: null });

      const result = await service.canAccessFeature('user-1', 'fdx_export');
      expect(result).toBe(false);
    });

    it('returns true for writer tier on paid features', async () => {
      queryMock.single.mockResolvedValue({ data: { tier: 'writer' }, error: null });

      const result = await service.canAccessFeature('user-1', 'fdx_export');
      expect(result).toBe(true);
    });

    it('returns true for pro tier on paid features', async () => {
      queryMock.single.mockResolvedValue({ data: { tier: 'pro' }, error: null });

      const result = await service.canAccessFeature('user-1', 'cloud_sync');
      expect(result).toBe(true);
    });
  });
});
