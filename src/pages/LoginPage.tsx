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
      <section className={styles.story}>
        <Link to="/welcome" className={styles.logo} aria-label="NexWriter home">
          Nex<span className={styles.logoAccent}>Writer</span>
        </Link>
        <div className={styles.storyCopy}>
          <span className={styles.eyebrow}>Welcome back</span>
          <h2>Your writing room is ready.</h2>
          <p>Open the latest draft, continue research, and keep the production trail moving.</p>
        </div>
        <img
          className={styles.authImage}
          src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=82"
          alt="A focused writing desk"
        />
      </section>

      <section className={styles.panel} aria-label="Sign in">
        <div className={styles.brand}>
          <span className={styles.panelKicker}>NexWriter account</span>
          <h1 className={styles.title}>Sign in</h1>
          <p className={styles.subtitle}>Pick up exactly where the story left off.</p>
        </div>
        <EmailPasswordForm mode="login" onSubmit={handleEmailLogin} />
        <SocialLoginButtons onProviderLogin={handleProviderLogin} />
        <p className={styles.footer}>
          No account yet?{' '}
          <Link className={styles.footerLink} to="/signup">
            Sign up
          </Link>
        </p>
      </section>
    </main>
  );
}
