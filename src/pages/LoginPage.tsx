import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { EmailPasswordForm } from '@/components/auth/EmailPasswordForm';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const navigate = useNavigate();
  const signIn = useAuthStore((s) => s.signIn);
  const signInWithProvider = useAuthStore((s) => s.signInWithProvider);

  const handleEmailLogin = async (email: string, password: string) => {
    await signIn(email, password);
    navigate('/');
  };

  const handleProviderLogin = async (provider: 'google' | 'github') => {
    await signInWithProvider(provider);
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Sign in to DraftKit</h1>
        <EmailPasswordForm mode="login" onSubmit={handleEmailLogin} />
        <SocialLoginButtons onProviderLogin={handleProviderLogin} />
        <p className={styles.footer}>
          Don&apos;t have an account?{' '}
          <Link className={styles.footerLink} to="/signup">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
