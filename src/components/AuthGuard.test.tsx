import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthGuard } from './AuthGuard';

let mockUser: { id: string } | null = null;
let mockLoading = false;

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ user: mockUser, loading: mockLoading }),
}));

function renderWithRouter(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/login" element={<div>LoginPage</div>} />
        <Route path="/" element={<AuthGuard />}>
          <Route index element={<div>DashboardPage</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('AuthGuard', () => {
  it('shows loading indicator while auth state is loading', () => {
    mockUser = null;
    mockLoading = true;
    renderWithRouter();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('redirects to /login when no user is authenticated', () => {
    mockUser = null;
    mockLoading = false;
    renderWithRouter();
    expect(screen.getByText('LoginPage')).toBeInTheDocument();
  });

  it('renders child routes when user is authenticated', () => {
    mockUser = { id: 'user-1' };
    mockLoading = false;
    renderWithRouter();
    expect(screen.getByText('DashboardPage')).toBeInTheDocument();
  });
});
