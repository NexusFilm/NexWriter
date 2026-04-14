import type { Beat, BeatPrompt, BeatExample } from '@/types/blueprint';
import styles from './BeatStepWizard.module.css';

interface BeatStepWizardProps {
  beats: Beat[];
  currentBeatIndex: number;
  answers: Record<string, string>;
  prompts: BeatPrompt[];
  examples: BeatExample[];
  onAnswer: (beatId: string, answer: string) => void;
  onNext: () => void;
  onBack: () => void;
  onComplete: () => void;
}

export function BeatStepWizard({
  beats,
  currentBeatIndex,
  answers,
  prompts,
  examples,
  onAnswer,
  onNext,
  onBack,
  onComplete,
}: BeatStepWizardProps) {
  const beat = beats[currentBeatIndex];
  if (!beat) return null;

  const isFirst = currentBeatIndex === 0;
  const isLast = currentBeatIndex === beats.length - 1;
  const answer = answers[beat.id] ?? '';
  const progress = ((currentBeatIndex + 1) / beats.length) * 100;

  return (
    <div className={styles.container}>
      <p className={styles.progress}>
        Beat {currentBeatIndex + 1} of {beats.length}
      </p>
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className={styles.beatHeader}>
        <h2 className={styles.beatName}>{beat.name}</h2>
        <p className={styles.beatDesc}>{beat.description}</p>
        {(beat.pageRangeStart != null || beat.pageRangeEnd != null) && (
          <p className={styles.pageRange}>
            Target pages: {beat.pageRangeStart ?? '?'}–{beat.pageRangeEnd ?? '?'}
          </p>
        )}
      </div>

      {prompts.length > 0 && (
        <div className={styles.promptsSection}>
          <p className={styles.promptsLabel}>Guidance</p>
          {prompts.map((p) => (
            <div key={p.id} className={styles.promptItem}>
              {p.promptText}
            </div>
          ))}
        </div>
      )}

      {examples.length > 0 && (
        <div className={styles.promptsSection}>
          <p className={styles.promptsLabel}>Examples</p>
          {examples.map((e) => (
            <div key={e.id} className={styles.exampleItem}>
              {e.exampleText}
              {e.sourceTitle && (
                <>
                  {' '}
                  — <span className={styles.exampleSource}>{e.sourceTitle}</span>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <textarea
        className={styles.answerArea}
        value={answer}
        onChange={(ev) => onAnswer(beat.id, ev.target.value)}
        placeholder={`Write your response for "${beat.name}"…`}
        aria-label={`Answer for ${beat.name}`}
      />

      <div className={styles.navRow}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={onBack}
          disabled={isFirst}
          style={isFirst ? { opacity: 0.4, cursor: 'default' } : undefined}
        >
          Back
        </button>
        {isLast ? (
          <button
            type="button"
            className={styles.navBtnPrimary}
            onClick={onComplete}
          >
            Finish
          </button>
        ) : (
          <button
            type="button"
            className={styles.navBtnPrimary}
            onClick={onNext}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
