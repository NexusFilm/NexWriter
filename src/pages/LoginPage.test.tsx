import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { AppError } from '@/types/errors';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockSignIn = vi.fn();
const mockSignInWithProvider = vi.fn();
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      signIn: mockSignIn,
      signInWithProvider: mockSignInWithProvider,
    }),
}));

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the sign-in heading and form fields', () => {
    renderLoginPage();
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders social login buttons', () => {
    renderLoginPage();
    expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /github/i })).toBeInTheDocument();
  });

  it('renders a link to the signup page', () => {
    renderLoginPage();
    const link = screen.getByRole('link', { name: /sign up/i });
    expect(link).toHaveAttribute('href', '/signup');
  });

  it('calls signIn and navigates to / on successful login', async () => {
    mockSignIn.mockResolvedValueOnce(undefined);
    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('displays AppError.userMessage on failed login', async () => {
    mockSignIn.mockRejectedValueOnce(
      new AppError('bad creds', 'AUTH_INVALID_CREDENTIALS', 'Invalid email or password. Please try again.'),
    );
    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'bad@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrong' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid email or password. Please try again.');
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('calls signInWithProvider when Google button is clicked', async () => {
    mockSignInWithProvider.mockResolvedValueOnce(undefined);
    renderLoginPage();

    fireEvent.click(screen.getByRole('button', { name: /google/i }));

    await waitFor(() => {
      expect(mockSignInWithProvider).toHaveBeenCalledWith('google');
    });
  });

  it('calls signInWithProvider when GitHub button is clicked', async () => {
    mockSignInWithProvider.mockResolvedValueOnce(undefined);
    renderLoginPage();

    fireEvent.click(screen.getByRole('button', { name: /github/i }));

    await waitFor(() => {
      expect(mockSignInWithProvider).toHaveBeenCalledWith('github');
    });
  });
});
