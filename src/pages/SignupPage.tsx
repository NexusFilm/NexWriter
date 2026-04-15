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
      <section className={styles.story}>
        <Link to="/welcome" className={styles.logo} aria-label="NexWriter home">
          Nex<span className={styles.logoAccent}>Writer</span>
        </Link>
        <div className={styles.storyCopy}>
          <span className={styles.eyebrow}>Start clean</span>
          <h2>One place for the script and the shoot.</h2>
          <p>Build the draft, boards, shot lists, and agreements around the same creative source.</p>
        </div>
        <img
          className={styles.authImage}
          src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=82"
          alt="A focused writing desk"
        />
      </section>

      <section className={styles.panel} aria-label="Create account">
        <div className={styles.brand}>
          <span className={styles.panelKicker}>NexWriter account</span>
          <h1 className={styles.title}>Create your account</h1>
          <p className={styles.subtitle}>Start with a focused workspace built for screenwriters.</p>
        </div>
        <EmailPasswordForm mode="signup" onSubmit={handleEmailSignup} />
        <SocialLoginButtons onProviderLogin={handleProviderLogin} />
        <p className={styles.footer}>
          Already writing here?{' '}
          <Link className={styles.footerLink} to="/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
