import { describe, it, expect } from 'vitest';
import { isAdmin } from './adminAccess';

describe('isAdmin', () => {
  it('returns true when role is admin', () => {
    expect(isAdmin('user@example.com', 'admin', '')).toBe(true);
  });

  it('returns true when email is in admin list', () => {
    expect(isAdmin('admin@test.com', 'user', 'admin@test.com,other@test.com')).toBe(true);
  });

  it('returns false when email is not in list and role is not admin', () => {
    expect(isAdmin('nobody@test.com', 'user', 'admin@test.com')).toBe(false);
  });

  it('handles case-insensitive email matching', () => {
    expect(isAdmin('Admin@Test.COM', 'user', 'admin@test.com')).toBe(true);
  });

  it('handles whitespace in admin emails list', () => {
    expect(isAdmin('admin@test.com', 'user', ' admin@test.com , other@test.com ')).toBe(true);
  });

  it('returns false when email is null', () => {
    expect(isAdmin(null, 'user', 'admin@test.com')).toBe(false);
  });

  it('returns false when email is undefined', () => {
    expect(isAdmin(undefined, 'user', 'admin@test.com')).toBe(false);
  });

  it('returns false when adminEmails is null', () => {
    expect(isAdmin('admin@test.com', 'user', null)).toBe(false);
  });

  it('returns false when adminEmails is undefined', () => {
    expect(isAdmin('admin@test.com', 'user', undefined)).toBe(false);
  });

  it('returns true when role is admin even with null email', () => {
    expect(isAdmin(null, 'admin', null)).toBe(true);
  });

  it('returns false for empty admin emails string', () => {
    expect(isAdmin('admin@test.com', 'user', '')).toBe(false);
  });

  it('handles single admin email without commas', () => {
    expect(isAdmin('solo@admin.com', 'user', 'solo@admin.com')).toBe(true);
  });
});
