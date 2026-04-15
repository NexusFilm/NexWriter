import { Link } from 'react-router-dom';
import styles from './CreditsPage.module.css';

/**
 * TMDB logo as a simple SVG placeholder.
 * Sized smaller than NexWriter branding per Requirement 12.4.
 */
function TMDBLogo() {
  return (
    <svg
      className={styles.tmdbLogoIcon}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="TMDB logo"
      role="img"
    >
      <rect width="28" height="28" rx="4" fill="#01b4e4" />
      <text
        x="14"
        y="18"
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        fill="#fff"
        fontFamily="sans-serif"
      >
        TMDB
      </text>
    </svg>
  );
}

export function CreditsPage() {
  return (
    <div className={styles.page}>
      <Link to="/" className={styles.backLink}>
        ← Back to Dashboard
      </Link>
      <h1 className={styles.heading}>Credits</h1>

      <div className={styles.panel}>
        <h2 className={styles.panelHeading}>Data Attribution</h2>

        <div className={styles.tmdbLogo}>
          <TMDBLogo />
          <span>The Movie Database</span>
        </div>

        <p className={styles.attribution}>
          This product uses the TMDB API but is not endorsed or certified by
          TMDB.
        </p>

        <p className={styles.attribution}>
          Movie and TV metadata and images are provided by TMDB.
        </p>

        <a
          className={styles.tmdbLink}
          href="https://www.themoviedb.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Visit The Movie Database →
        </a>
      </div>
    </div>
  );
}
