import { Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import styles from './LandingPage.module.css';

export function LandingPage() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className={styles.page}>
      <nav className={styles.nav} aria-label="Public navigation">
        <Link to="/welcome" className={styles.logo} aria-label="NexWriter home">
          Nex<span>Writer</span>
        </Link>
        <div className={styles.navActions}>
          <Link to="/login" className={styles.loginLink}>
            Sign in
          </Link>
          <Link to="/signup" className={styles.navCta}>
            Start writing
          </Link>
        </div>
      </nav>

      <section className={styles.hero}>
        <img
          className={styles.heroImage}
          src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1800&q=84"
          alt="A focused writing desk with screenplay notes"
        />
        <div className={styles.copy}>
          <span className={styles.eyebrow}>Screenwriting workspace</span>
          <h1>Write the scene. Build the film.</h1>
          <p>
            Draft, plan, research, and package production details in one focused writing room.
          </p>
          <div className={styles.ctaRow}>
            <Link to="/signup" className={styles.primaryCta}>
              Start writing
            </Link>
          </div>
        </div>

        <div className={styles.editorPreview} aria-hidden="true">
          <div className={styles.previewHeader}>
            <span>INT. WRITING ROOM - NIGHT</span>
            <strong>Page 12</strong>
          </div>
          <div className={styles.scriptLines}>
            <span className={styles.lineWide} />
            <span className={styles.lineMedium} />
            <span className={styles.character}>MARA</span>
            <span className={styles.dialogue} />
            <span className={styles.dialogueShort} />
            <span className={styles.lineMedium} />
          </div>
        </div>
      </section>

      <section className={styles.context} aria-label="NexWriter workflow">
        <div>
          <span className={styles.contextLabel}>For</span>
          <strong>Writers moving from idea to shoot.</strong>
        </div>
        <div>
          <span className={styles.contextLabel}>Use</span>
          <strong>Drafts, boards, shot lists, agreements.</strong>
        </div>
        <div>
          <span className={styles.contextLabel}>Why</span>
          <strong>Less switching. More momentum.</strong>
        </div>
      </section>

      <section className={styles.inside}>
        <div className={styles.insideCopy}>
          <span className={styles.eyebrow}>Inside</span>
          <h2>Everything stays close to the script.</h2>
        </div>
        <div className={styles.intentTabs} aria-label="NexWriter capabilities">
          <Link to="/signup" className={styles.intent}>
            <span>Create</span>
            <strong>Screenplay drafts and story blueprints</strong>
          </Link>
          <Link to="/signup" className={styles.intent}>
            <span>Manage</span>
            <strong>Visual references and production boards</strong>
          </Link>
          <Link to="/signup" className={styles.intent}>
            <span>Package</span>
            <strong>Shot lists, lighting notes, and agreements</strong>
          </Link>
        </div>
      </section>
    </main>
  );
}
