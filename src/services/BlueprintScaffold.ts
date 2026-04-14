import type { Beat } from '@/types/blueprint';

export interface SceneBlueprintData {
  sceneOrder: number;
  heading: string;
  beatId: string;
  notes: string;
}

/**
 * Generate a story summary from collected answers.
 */
export function generateStorySummary(
  answers: Record<string, string>,
  beats: Beat[],
): string {
  const parts: string[] = [];
  for (const beat of beats) {
    const answer = answers[beat.id];
    if (answer && answer.trim()) {
      parts.push(`${beat.name}: ${answer.trim()}`);
    }
  }
  return parts.join('\n\n');
}

/**
 * Generate scene blueprints from collected answers.
 * Each answered beat produces one scene blueprint entry.
 */
export function generateSceneBlueprints(
  answers: Record<string, string>,
  beats: Beat[],
): SceneBlueprintData[] {
  const scenes: SceneBlueprintData[] = [];
  let order = 1;

  for (const beat of beats) {
    const answer = answers[beat.id];
    if (answer && answer.trim()) {
      scenes.push({
        sceneOrder: order,
        heading: `${beat.name.toUpperCase()} — BEAT ${beat.beatOrder}`,
        beatId: beat.id,
        notes: answer.trim(),
      });
      order++;
    }
  }

  return scenes;
}

/**
 * Generate a beat list summary for display.
 */
export function generateBeatList(
  answers: Record<string, string>,
  beats: Beat[],
): Array<{ beat: Beat; answer: string; completed: boolean }> {
  return beats.map((beat) => ({
    beat,
    answer: answers[beat.id] ?? '',
    completed: !!(answers[beat.id] && answers[beat.id].trim()),
  }));
}
