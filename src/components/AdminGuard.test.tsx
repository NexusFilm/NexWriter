import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AdminGuard } from './AdminGuard';

let mockUser: { id: string; email: string } | null = null;
let mockRole: string | null = 'user';
let mockSupabaseAvailable = true;

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ user: mockUser, loading: false }),
}));

vi.mock('@/lib/supabase', () => ({
  hasSupabase: (() => mockSupabaseAvailable) as unknown as boolean,
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { role: mockRole }, error: null }),
        }),
      }),
    }),
  },
}));

// Stub VITE_ADMIN_EMAILS
const originalEnv = import.meta.env.VITE_ADMIN_EMAILS;

function renderWithRouter(initialRoute = '/admin') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/" element={<div>DashboardPage</div>} />
        <Route path="/admin" element={<AdminGuard />}>
          <Route index element={<div>AdminPage</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('AdminGuard', () => {
  beforeEach(() => {
    mockUser = null;
    mockRole = 'user';
    mockSupabaseAvailable = true;
    import.meta.env.VITE_ADMIN_EMAILS = '';
  });

  afterAll(() => {
    import.meta.env.VITE_ADMIN_EMAILS = originalEnv;
  });

  it('redirects to / when no user is authenticated', async () => {
    mockUser = null;
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText('DashboardPage')).toBeInTheDocument();
    });
  });

  it('renders admin page when user email is in VITE_ADMIN_EMAILS', async () => {
    mockUser = { id: 'u1', email: 'admin@test.com' };
    import.meta.env.VITE_ADMIN_EMAILS = 'admin@test.com';
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText('AdminPage')).toBeInTheDocument();
    });
  });

  it('renders admin page when user role is admin (fallback)', async () => {
    mockUser = { id: 'u1', email: 'regular@test.com' };
    mockRole = 'admin';
    import.meta.env.VITE_ADMIN_EMAILS = '';
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText('AdminPage')).toBeInTheDocument();
    });
  });

  it('redirects non-admin user to /', async () => {
    mockUser = { id: 'u1', email: 'regular@test.com' };
    mockRole = 'user';
    import.meta.env.VITE_ADMIN_EMAILS = 'admin@test.com';
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText('DashboardPage')).toBeInTheDocument();
    });
  });
});
