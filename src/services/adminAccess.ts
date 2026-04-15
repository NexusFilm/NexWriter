/**
 * Pure function to determine if a user has admin access.
 *
 * @param email - The user's email address (may be undefined)
 * @param role - The user's role from sw_user_profiles (may be undefined)
 * @param adminEmails - Comma-separated list of admin emails from VITE_ADMIN_EMAILS
 * @returns true if the email is in the admin list OR the role is 'admin'
 */
export function isAdmin(
  email: string | undefined | null,
  role: string | undefined | null,
  adminEmails: string | undefined | null,
): boolean {
  if (role === 'admin') return true;

  if (!email || !adminEmails) return false;

  const normalizedEmail = email.trim().toLowerCase();
  const emailList = adminEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return emailList.includes(normalizedEmail);
}
