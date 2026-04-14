import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBlueprintStore } from '@/stores/blueprintStore';
import { BlueprintRepository } from '@/repositories/BlueprintRepository';
import { SuggestionEngine } from '@/services/SuggestionEngine';
import { generateScaffold } from '@/services/ScaffoldGenerator';
import { FrameworkSelector } from '@/components/blueprint/FrameworkSelector';
import { GenreToneConfig } from '@/components/blueprint/GenreToneConfig';
import { BeatStepWizard } from '@/components/blueprint/BeatStepWizard';
import { BlueprintSummary } from '@/components/blueprint/BlueprintSummary';
import type { Framework, Beat, BeatPrompt, BeatExample } from '@/types/blueprint';
import styles from './BlueprintWizardPage.module.css';

type WizardStep = 'framework' | 'genre' | 'beats' | 'summary';

const repo = new BlueprintRepository();
const engine = new SuggestionEngine();

export function BlueprintWizardPage() {
  const { sessionId: paramSessionId } = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();

  const {
    framework,
    genre,
    format,
    tone,
    currentBeatIndex,
    answers,
    setFramework,
    setGenreToneFormat,
    advanceBeat,
    setAnswer,
  } = useBlueprintStore();

  const [step, setStep] = useState<WizardStep>('framework');
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [prompts, setPrompts] = useState<BeatPrompt[]>([]);
  const [examples, setExamples] = useState<BeatExample[]>([]);

  // Load frameworks on mount
  useEffect(() => {
    repo.getFrameworks().then(setFrameworks).catch(console.error);
  }, []);

  // Load beats when framework changes
  useEffect(() => {
    if (framework) {
      repo.getFrameworkBeats(framework.id).then(setBeats).catch(console.error);
    }
  }, [framework]);

  // Load prompts/examples when beat changes
  useEffect(() => {
    if (!framework || beats.length === 0 || step !== 'beats') return;
    const beat = beats[currentBeatIndex];
    if (!beat) return;

    engine
      .getPrompts(framework.id, beat.id, genre, format)
      .then(setPrompts)
      .catch(() => {
        // Fallback to universal prompts
        engine
          .getFallbackPrompts(framework.id, beat.id)
          .then(setPrompts)
          .catch(console.error);
      });

    engine
      .getExamples(framework.id, beat.id, genre)
      .then(setExamples)
      .catch(() => setExamples([]));
  }, [framework, beats, currentBeatIndex, genre, format, step]);

  // Resume session if sessionId param is provided
  useEffect(() => {
    if (paramSessionId) {
      repo
        .getOutlineSession(paramSessionId)
        .then((session) => {
          const fw = frameworks.find((f) => f.id === session.frameworkId);
          if (fw) {
            setFramework(fw);
            setGenreToneFormat(session.genre, session.format, session.tone);
          }
          return repo.getOutlineAnswers(paramSessionId);
        })
        .then((savedAnswers) => {
          for (const a of savedAnswers) {
            setAnswer(a.beatId, a.answerText);
          }
          setStep('beats');
        })
        .catch(console.error);
    }
  }, [paramSessionId, frameworks, setFramework, setGenreToneFormat, setAnswer]);

  const handleFrameworkSelect = useCallback(
    (fw: Framework) => {
      setFramework(fw);
    },
    [setFramework],
  );

  const handleContinueToGenre = () => {
    if (framework) setStep('genre');
  };

  const handleContinueToBeats = () => {
    if (genre && format && tone) setStep('beats');
  };

  const handleBeatNext = () => {
    const beat = beats[currentBeatIndex];
    if (beat && answers[beat.id]) {
      repo
        .saveOutlineAnswer({
          sessionId: paramSessionId ?? '',
          beatId: beat.id,
          answerText: answers[beat.id],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .catch(console.error);
    }
    advanceBeat();
  };

  const handleBeatBack = () => {
    if (currentBeatIndex === 0) {
      setStep('genre');
    } else {
      useBlueprintStore.setState((s) => ({
        currentBeatIndex: Math.max(0, s.currentBeatIndex - 1),
      }));
    }
  };

  const handleComplete = () => {
    // Save last beat answer
    const beat = beats[currentBeatIndex];
    if (beat && answers[beat.id]) {
      repo
        .saveOutlineAnswer({
          sessionId: paramSessionId ?? '',
          beatId: beat.id,
          answerText: answers[beat.id],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .catch(console.error);
    }
    setStep('summary');
  };

  const handleStartWriting = () => {
    const scaffold = generateScaffold(answers, beats);
    // Store scaffold in editor store and navigate to editor
    // The EditorPage will pick up the scaffold from the store
    const { useEditorStore } = require('@/stores/editorStore');
    useEditorStore.getState().setElements(scaffold);
    navigate('/');
  };

  const handleSummaryBack = () => {
    setStep('beats');
  };

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        {step === 'framework' && (
          <>
            <FrameworkSelector
              frameworks={frameworks}
              beats={beats}
              selectedId={framework?.id ?? null}
              onSelect={handleFrameworkSelect}
            />
            <div className={styles.continueRow}>
              <button
                type="button"
                className={styles.continueBtn}
                disabled={!framework}
                onClick={handleContinueToGenre}
              >
                Continue
              </button>
            </div>
          </>
        )}

        {step === 'genre' && (
          <>
            <GenreToneConfig
              genre={genre}
              format={format}
              tone={tone}
              onGenreChange={(g) => setGenreToneFormat(g, format, tone)}
              onFormatChange={(f) => setGenreToneFormat(genre, f, tone)}
              onToneChange={(t) => setGenreToneFormat(genre, format, t)}
            />
            <div className={styles.continueRow}>
              <button
                type="button"
                className={styles.continueBtn}
                disabled={!genre || !format || !tone}
                onClick={handleContinueToBeats}
              >
                Continue
              </button>
            </div>
          </>
        )}

        {step === 'beats' && (
          <BeatStepWizard
            beats={beats}
            currentBeatIndex={currentBeatIndex}
            answers={answers}
            prompts={prompts}
            examples={examples}
            onAnswer={setAnswer}
            onNext={handleBeatNext}
            onBack={handleBeatBack}
            onComplete={handleComplete}
          />
        )}

        {step === 'summary' && (
          <BlueprintSummary
            beats={beats}
            answers={answers}
            onStartWriting={handleStartWriting}
            onBack={handleSummaryBack}
          />
        )}
      </div>
    </div>
  );
}
