import styles from './ShotListPage.module.css';

const MOVEMENT_OPTIONS = [
  '',
  'Static',
  'Pan',
  'Tilt',
  'Dolly',
  'Tracking',
  'Crane',
  'Handheld',
  'Steadicam',
  'Drone',
];

interface MovementSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function MovementSelect({ value, onChange }: MovementSelectProps) {
  return (
    <select
      className={styles.shotTypeSelect}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Camera movement"
    >
      {MOVEMENT_OPTIONS.map((opt) => (
        <option key={opt} value={opt}>
          {opt || '—'}
        </option>
      ))}
    </select>
  );
}
