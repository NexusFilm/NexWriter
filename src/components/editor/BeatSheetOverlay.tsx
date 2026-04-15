import { useState } from 'react';
import styles from './BeatSheetOverlay.module.css';

interface BeatTemplate {
  id: string;
  name: string;
  beats: string[];
}

const BEAT_TEMPLATES: BeatTemplate[] = [
  {
    id: '5p-model',
    name: '5P Model',
    beats: [
      'Person — Protagonist, flaw, wound, desire',
      'Problem — Central conflict, opposition, urgency',
      'Plan — Strategy and early actions',
      'Pivot — Midpoint turn, revelation, identity shift',
      'Payoff — Climax, transformation, resolution',
    ],
  },
  {
    id: '3-act',
    name: '3-Act Structure',
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
  {
    id: 'story-circle',
    name: 'Dan Harmon Story Circle',
    beats: [
      'You — A character in a zone of comfort',
      'Need — But they want something',
      'Go — They enter an unfamiliar situation',
      'Search — Adapt to it',
      'Find — Get what they wanted',
      'Take — Pay a heavy price for it',
      'Return — Then return to their familiar situation',
      'Change — Having changed',
    ],
  },
  {
    id: '7-point',
    name: '7-Point Story Structure',
    beats: [
      'Hook',
      'Plot Turn 1',
      'Pinch Point 1',
      'Midpoint',
      'Pinch Point 2',
      'Plot Turn 2',
      'Resolution',
    ],
  },
];

export function BeatSheetOverlay() {
  const [selectedId, setSelectedId] = useState<string | null>('5p-model');

  const handleTemplateClick = (template: BeatTemplate) => {
    setSelectedId(selectedId === template.id ? null : template.id);
  };

  const selectedTemplate = BEAT_TEMPLATES.find((t) => t.id === selectedId);

  return (
    <div className={styles.panel}>
      <h3 className={styles.heading}>Beat Sheets</h3>
      <ul className={styles.templateList}>
        {BEAT_TEMPLATES.map((template) => {
          const isActive = selectedId === template.id;
          return (
            <li key={template.id}>
              <button
                className={isActive ? styles.templateBtnActive : styles.templateBtn}
                onClick={() => handleTemplateClick(template)}
                type="button"
              >
                {template.name}
                {template.id === '5p-model' && (
                  <span className={styles.badge}>Recommended</span>
                )}
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
              <span>{beat}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
