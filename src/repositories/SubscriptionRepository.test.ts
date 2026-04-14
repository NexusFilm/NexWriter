import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '@/types/errors';

// Chainable query builder mock
function createQueryMock() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const self = () => chain;

  chain.select = vi.fn().mockReturnValue(self());
  chain.eq = vi.fn().mockReturnValue(self());
  chain.single = vi.fn().mockResolvedValue({ data: null, error: null });

  (self() as any).then = (resolve: Function) =>
    chain.single().then((result: any) => resolve(result));

  return chain;
}

let queryMock = createQueryMock();
const invokeMock = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => {
      const self = () => queryMock;
      return {
        select: (...args: unknown[]) => { queryMock.select(...args); return self(); },
        eq: (...args: unknown[]) => { queryMock.eq(...args); return self(); },
        single: () => queryMock.single(),
        then: (resolve: Function) => queryMock.single().then((r: any) => resolve(r)),
      };
    }),
    functions: {
      invoke: (...args: unknown[]) => invokeMock(...args),
    },
  },
}));

import { SubscriptionRepository } from './SubscriptionRepository';

describe('SubscriptionRepository', () => {
  let repo: SubscriptionRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    queryMock = createQueryMock();
    repo = new SubscriptionRepository();
  });

  describe('getUserTier', () => {
    it('returns the tier for a given user', async () => {
      queryMock.single.mockResolvedValue({ data: { tier: 'writer' }, error: null });

      const tier = await repo.getUserTier('user-1');
      expect(tier).toBe('writer');
      expect(queryMock.select).toHaveBeenCalledWith('tier');
      expect(queryMock.eq).toHaveBeenCalledWith('id', 'user-1');
    });

    it('returns free tier for free users', async () => {
      queryMock.single.mockResolvedValue({ data: { tier: 'free' }, error: null });

      const tier = await repo.getUserTier('user-2');
      expect(tier).toBe('free');
    });

    it('throws AppError on failure', async () => {
      queryMock.single.mockResolvedValue({ data: null, error: { message: 'DB error' } });

      await expect(repo.getUserTier('user-1')).rejects.toThrow(AppError);
      await expect(repo.getUserTier('user-1')).rejects.toMatchObject({
        code: 'UNKNOWN_ERROR',
      });
    });
  });

  describe('createCheckoutSession', () => {
    it('invokes the edge function and returns the checkout URL', async () => {
      invokeMock.mockResolvedValue({ data: { url: 'https://checkout.stripe.com/session-123' }, error: null });

      const url = await repo.createCheckoutSession('user-1', 'writer');
      expect(url).toBe('https://checkout.stripe.com/session-123');
      expect(invokeMock).toHaveBeenCalledWith('create-checkout-session', {
        body: { userId: 'user-1', tier: 'writer' },
      });
    });

    it('passes the correct tier for pro', async () => {
      invokeMock.mockResolvedValue({ data: { url: 'https://checkout.stripe.com/pro-456' }, error: null });

      const url = await repo.createCheckoutSession('user-1', 'pro');
      expect(url).toBe('https://checkout.stripe.com/pro-456');
      expect(invokeMock).toHaveBeenCalledWith('create-checkout-session', {
        body: { userId: 'user-1', tier: 'pro' },
      });
    });

    it('throws AppError when edge function returns an error', async () => {
      invokeMock.mockResolvedValue({ data: null, error: { message: 'Function error' } });

      await expect(repo.createCheckoutSession('user-1', 'writer')).rejects.toThrow(AppError);
      await expect(repo.createCheckoutSession('user-1', 'writer')).rejects.toMatchObject({
        code: 'STRIPE_CHECKOUT_FAILED',
      });
    });

    it('throws AppError when no URL is returned', async () => {
      invokeMock.mockResolvedValue({ data: {}, error: null });

      await expect(repo.createCheckoutSession('user-1', 'writer')).rejects.toThrow(AppError);
      await expect(repo.createCheckoutSession('user-1', 'writer')).rejects.toMatchObject({
        code: 'STRIPE_CHECKOUT_FAILED',
      });
    });

    it('throws AppError when data is null', async () => {
      invokeMock.mockResolvedValue({ data: null, error: null });

      await expect(repo.createCheckoutSession('user-1', 'pro')).rejects.toThrow(AppError);
    });
  });

  describe('getSubscriptionStatus', () => {
    it('returns active status for paid tier', async () => {
      queryMock.single.mockResolvedValue({
        data: { tier: 'pro', stripe_customer_id: 'cus_123' },
        error: null,
      });

      const status = await repo.getSubscriptionStatus('user-1');
      expect(status).toEqual({
        tier: 'pro',
        stripeCustomerId: 'cus_123',
        active: true,
      });
      expect(queryMock.select).toHaveBeenCalledWith('tier, stripe_customer_id');
      expect(queryMock.eq).toHaveBeenCalledWith('id', 'user-1');
    });

    it('returns inactive status for free tier', async () => {
      queryMock.single.mockResolvedValue({
        data: { tier: 'free', stripe_customer_id: null },
        error: null,
      });

      const status = await repo.getSubscriptionStatus('user-1');
      expect(status).toEqual({
        tier: 'free',
        stripeCustomerId: null,
        active: false,
      });
    });

    it('returns active status for writer tier', async () => {
      queryMock.single.mockResolvedValue({
        data: { tier: 'writer', stripe_customer_id: 'cus_456' },
        error: null,
      });

      const status = await repo.getSubscriptionStatus('user-1');
      expect(status.active).toBe(true);
      expect(status.tier).toBe('writer');
    });

    it('throws AppError on failure', async () => {
      queryMock.single.mockResolvedValue({ data: null, error: { message: 'DB error' } });

      await expect(repo.getSubscriptionStatus('user-1')).rejects.toThrow(AppError);
      await expect(repo.getSubscriptionStatus('user-1')).rejects.toMatchObject({
        code: 'UNKNOWN_ERROR',
      });
    });
  });
});
