import { useState } from 'react';
import type { Tier } from '@/types/subscription';
import styles from './BeatSheetOverlay.module.css';

interface BeatTemplate {
  id: string;
  name: string;
  beats: string[];
  paidOnly: boolean;
}

const BEAT_TEMPLATES: BeatTemplate[] = [
  {
    id: '3-act',
    name: '3-Act Structure',
    paidOnly: false,
    beats: [
      'Setup / Exposition',
      'Inciting Incident',
      'Rising Action',
      'Midpoint',
      'Complications',
      'Climax',
      'Resolution',
    ],
  },
  {
    id: 'save-the-cat',
    name: 'Save the Cat',
    paidOnly: true,
    beats: [
      'Opening Image',
      'Theme Stated',
      'Set-Up',
      'Catalyst',
      'Debate',
      'Break into Two',
      'B Story',
      'Fun and Games',
      'Midpoint',
      'Bad Guys Close In',
      'All Is Lost',
      'Dark Night of the Soul',
      'Break into Three',
      'Finale',
      'Final Image',
    ],
  },
  {
    id: 'heros-journey',
    name: "Hero's Journey",
    paidOnly: true,
    beats: [
      'Ordinary World',
      'Call to Adventure',
      'Refusal of the Call',
      'Meeting the Mentor',
      'Crossing the Threshold',
      'Tests, Allies, Enemies',
      'Approach to the Inmost Cave',
      'Ordeal',
      'Reward',
      'The Road Back',
      'Resurrection',
      'Return with the Elixir',
    ],
  },
];

interface BeatSheetOverlayProps {
  tier: Tier;
  onPaywallRequest: () => void;
}

export function BeatSheetOverlay({ tier, onPaywallRequest }: BeatSheetOverlayProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isPaid = tier === 'writer' || tier === 'pro';

  const handleTemplateClick = (template: BeatTemplate) => {
    if (template.paidOnly && !isPaid) {
      onPaywallRequest();
      return;
    }
    setSelectedId(selectedId === template.id ? null : template.id);
  };

  const selectedTemplate = BEAT_TEMPLATES.find((t) => t.id === selectedId);

  return (
    <div className={styles.panel}>
      <h3 className={styles.heading}>Beat Sheets</h3>
      <ul className={styles.templateList}>
        {BEAT_TEMPLATES.map((template) => {
          const isLocked = template.paidOnly && !isPaid;
          const isActive = selectedId === template.id;

          const btnClass = isLocked
            ? styles.templateBtnLocked
            : isActive
              ? styles.templateBtnActive
              : styles.templateBtn;

          return (
            <li key={template.id}>
              <button
                className={btnClass}
                onClick={() => handleTemplateClick(template)}
                type="button"
                aria-label={isLocked ? `${template.name} (locked)` : template.name}
              >
                <span>{template.name}</span>
                {isLocked && <span className={styles.lockIcon} aria-hidden="true">🔒</span>}
              </button>
            </li>
          );
        })}
      </ul>

      {selectedTemplate && (
        <ol className={styles.beatList}>
          {selectedTemplate.beats.map((beat, i) => (
            <li key={beat} className={styles.beatItem}>
              <span className={styles.beatIndex}>{i + 1}.</span>
              {beat}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
