import styles from './GenreToneConfig.module.css';

const GENRES = ['Drama', 'Comedy', 'Thriller', 'Horror', 'Sci-Fi', 'Romance', 'Action'];
const FORMATS = ['Feature', 'Short', 'Pilot'];
const TONES = ['Dark', 'Light', 'Satirical', 'Grounded'];

interface GenreToneConfigProps {
  genre: string;
  format: string;
  tone: string;
  onGenreChange: (genre: string) => void;
  onFormatChange: (format: string) => void;
  onToneChange: (tone: string) => void;
}

export function GenreToneConfig({
  genre,
  format,
  tone,
  onGenreChange,
  onFormatChange,
  onToneChange,
}: GenreToneConfigProps) {
  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Genre, Format &amp; Tone</h2>

      <div className={styles.fieldGroup}>
        <span className={styles.label}>Genre</span>
        <div className={styles.options} role="radiogroup" aria-label="Genre">
          {GENRES.map((g) => (
            <button
              key={g}
              type="button"
              role="radio"
              aria-checked={genre === g}
              className={genre === g ? styles.optionSelected : styles.option}
              onClick={() => onGenreChange(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <span className={styles.label}>Format</span>
        <div className={styles.options} role="radiogroup" aria-label="Format">
          {FORMATS.map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={format === f}
              className={format === f ? styles.optionSelected : styles.option}
              onClick={() => onFormatChange(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <span className={styles.label}>Tone</span>
        <div className={styles.options} role="radiogroup" aria-label="Tone">
          {TONES.map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={tone === t}
              className={tone === t ? styles.optionSelected : styles.option}
              onClick={() => onToneChange(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
