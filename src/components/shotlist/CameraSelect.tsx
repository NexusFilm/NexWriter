import styles from './ShotListPage.module.css';

const CAMERA_OPTIONS = ['', 'A Cam', 'B Cam', 'C Cam'];

interface CameraSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function CameraSelect({ value, onChange }: CameraSelectProps) {
  return (
    <select
      className={styles.shotTypeSelect}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Camera designation"
    >
      {CAMERA_OPTIONS.map((opt) => (
        <option key={opt} value={opt}>
          {opt || '—'}
        </option>
      ))}
    </select>
  );
}
