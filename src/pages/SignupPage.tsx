import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { EmailPasswordForm } from '@/components/auth/EmailPasswordForm';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import styles from './SignupPage.module.css';

export function SignupPage() {
  const navigate = useNavigate();
  const signUp = useAuthStore((s) => s.signUp);
  const signInWithProvider = useAuthStore((s) => s.signInWithProvider);

  const handleEmailSignup = async (email: string, password: string) => {
    await signUp(email, password);
    navigate('/');
  };

  const handleProviderLogin = async (provider: 'google' | 'github') => {
    await signInWithProvider(provider);
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Create your account</h1>
        <EmailPasswordForm mode="signup" onSubmit={handleEmailSignup} />
        <SocialLoginButtons onProviderLogin={handleProviderLogin} />
        <p className={styles.footer}>
          Already have an account?{' '}
          <Link className={styles.footerLink} to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
