/**
 * Pure function to check if an account is locked.
 * Returns true if lockedAt is non-null (account is locked).
 */
export function isAccountLocked(lockedAt: string | null | undefined): boolean {
  return lockedAt != null;
}
