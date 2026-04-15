import type { ShotType } from '@/types/productionTools';
import styles from './ShotListPage.module.css';

const SHOT_TYPES: { value: ShotType; label: string }[] = [
  { value: 'wide', label: 'Wide' },
  { value: 'medium', label: 'Medium' },
  { value: 'close-up', label: 'Close-Up' },
  { value: 'extreme-close-up', label: 'Extreme Close-Up' },
  { value: 'over-the-shoulder', label: 'Over the Shoulder' },
  { value: 'pov', label: 'POV' },
  { value: 'insert', label: 'Insert' },
  { value: 'establishing', label: 'Establishing' },
  { value: 'two-shot', label: 'Two-Shot' },
  { value: 'aerial', label: 'Aerial' },
];

interface ShotTypeSelectProps {
  value: ShotType;
  onChange: (value: ShotType) => void;
}

export function ShotTypeSelect({ value, onChange }: ShotTypeSelectProps) {
  return (
    <select
      className={styles.shotTypeSelect}
      value={value}
      onChange={(e) => onChange(e.target.value as ShotType)}
      aria-label="Shot type"
    >
      {SHOT_TYPES.map((t) => (
        <option key={t.value} value={t.value}>
          {t.label}
        </option>
      ))}
    </select>
  );
}
