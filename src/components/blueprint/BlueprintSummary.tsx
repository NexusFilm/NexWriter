import type { Beat } from '@/types/blueprint';
import {
  generateBeatList,
  generateSceneBlueprints,
} from '@/services/BlueprintScaffold';
import styles from './BlueprintSummary.module.css';

interface BlueprintSummaryProps {
  beats: Beat[];
  answers: Record<string, string>;
  onStartWriting: () => void;
  onBack: () => void;
}

export function BlueprintSummary({
  beats,
  answers,
  onStartWriting,
  onBack,
}: BlueprintSummaryProps) {
  const beatList = generateBeatList(answers, beats);
  const scenes = generateSceneBlueprints(answers, beats);

  const scaffoldPreview = scenes
    .map((s) => `${s.heading}\n${s.notes}`)
    .join('\n\n');

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Blueprint Summary</h2>
      <p className={styles.subheading}>
        Review your outline before generating the editor scaffold.
      </p>

      <ul className={styles.beatList}>
        {beatList.map(({ beat, answer, completed }) => (
          <li key={beat.id} className={styles.beatItem}>
            <p className={styles.beatName}>{beat.name}</p>
            {completed ? (
              <p className={styles.beatAnswer}>{answer}</p>
            ) : (
              <p className={styles.beatEmpty}>No answer provided</p>
            )}
          </li>
        ))}
      </ul>

      {scenes.length > 0 && (
        <>
          <h3 className={styles.heading} style={{ fontSize: 16 }}>
            Scaffold Preview
          </h3>
          <div className={styles.scaffoldPreview}>{scaffoldPreview}</div>
        </>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.actionBtnSecondary}
          onClick={onBack}
        >
          Back
        </button>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={onStartWriting}
        >
          Start Writing
        </button>
      </div>
    </div>
  );
}
