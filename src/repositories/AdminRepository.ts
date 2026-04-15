import { supabase } from '@/lib/supabase';

import { AppError } from '@/types/errors';
import type { AdminUserRow, IAdminRepository } from '@/types/productionTools';

interface UserProfileRow {
  id: string;
  email: string;
  display_name: string | null;
  tier: string;
  created_at: string;
  locked_at: string | null;
}

function mapUserRow(row: UserProfileRow, scriptCount: number): AdminUserRow {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    tier: row.tier,
    scriptCount,
    createdAt: row.created_at,
    lockedAt: row.locked_at,
  };
}

export class AdminRepository implements IAdminRepository {
  async getTotalUsers(): Promise<number> {
    const { count, error } = await supabase
      .from('sw_user_profiles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw new AppError(
        error.message,
        'ADMIN_ACTION_FAILED',
        'Unable to fetch total users. Please try again.',
        true,
      );
    }

    return count ?? 0;
  }

  async getTotalScripts(): Promise<number> {
    const { count, error } = await supabase
      .from('sw_scripts')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw new AppError(
        error.message,
        'ADMIN_ACTION_FAILED',
        'Unable to fetch total scripts. Please try again.',
        true,
      );
    }

    return count ?? 0;
  }

  async getActiveUsersLast7Days(): Promise<number> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('sw_scripts')
      .select('user_id')
      .gte('updated_at', sevenDaysAgo.toISOString());

    if (error) {
      throw new AppError(
        error.message,
        'ADMIN_ACTION_FAILED',
        'Unable to fetch active users. Please try again.',
        true,
      );
    }

    const uniqueUserIds = new Set((data ?? []).map((row: { user_id: string }) => row.user_id));
    return uniqueUserIds.size;
  }

  async getUsers(page: number, pageSize: number): Promise<{ users: AdminUserRow[]; total: number }> {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await supabase
      .from('sw_user_profiles')
      .select('id, email, display_name, tier, created_at, locked_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new AppError(
        error.message,
        'ADMIN_ACTION_FAILED',
        'Unable to fetch users. Please try again.',
        true,
      );
    }

    const rows = (data ?? []) as UserProfileRow[];

    // Fetch script counts for each user
    const users: AdminUserRow[] = await Promise.all(
      rows.map(async (row) => {
        const { count: scriptCount, error: scriptError } = await supabase
          .from('sw_scripts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', row.id);

        if (scriptError) {
          return mapUserRow(row, 0);
        }

        return mapUserRow(row, scriptCount ?? 0);
      }),
    );

    return { users, total: count ?? 0 };
  }

  async lockUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('sw_user_profiles')
      .update({ locked_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      throw new AppError(
        error.message,
        'ADMIN_ACTION_FAILED',
        'Unable to lock user account. Please try again.',
        true,
      );
    }
  }

  async unlockUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('sw_user_profiles')
      .update({ locked_at: null })
      .eq('id', userId);

    if (error) {
      throw new AppError(
        error.message,
        'ADMIN_ACTION_FAILED',
        'Unable to unlock user account. Please try again.',
        true,
      );
    }
  }
}
