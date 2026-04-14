import { supabase } from '@/lib/supabase';

import { AppError } from '@/types/errors';
import type { Tier, SubscriptionStatus } from '@/types/subscription';
import type { ISubscriptionRepository } from '@/types/repositories';

interface UserProfileRow {
  tier: Tier;
  stripe_customer_id: string | null;
}

export class SubscriptionRepository implements ISubscriptionRepository {
  async getUserTier(userId: string): Promise<Tier> {
    const { data, error } = await supabase
      .from('sw_user_profiles')
      .select('tier')
      .eq('id', userId)
      .single();

    if (error) {
      throw new AppError(
        error.message,
        'UNKNOWN_ERROR',
        'Unable to retrieve subscription tier. Please try again.',
        true,
      );
    }

    return (data as Pick<UserProfileRow, 'tier'>).tier;
  }

  async createCheckoutSession(userId: string, tier: 'writer' | 'pro'): Promise<string> {
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { userId, tier },
    });

    if (error) {
      throw new AppError(
        error.message,
        'STRIPE_CHECKOUT_FAILED',
        'Unable to start checkout. Please try again.',
        true,
      );
    }

    if (!data?.url) {
      throw new AppError(
        'Checkout session created but no URL returned',
        'STRIPE_CHECKOUT_FAILED',
        'Unable to start checkout. Please try again.',
        true,
      );
    }

    return data.url as string;
  }

  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    const { data, error } = await supabase
      .from('sw_user_profiles')
      .select('tier, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (error) {
      throw new AppError(
        error.message,
        'UNKNOWN_ERROR',
        'Unable to retrieve subscription status. Please try again.',
        true,
      );
    }

    const row = data as UserProfileRow;

    return {
      tier: row.tier,
      stripeCustomerId: row.stripe_customer_id,
      active: row.tier !== 'free',
    };
  }
}
