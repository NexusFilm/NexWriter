import type { Beat } from '@/types/blueprint';
import type { ScreenplayElement } from '@/types/screenplay';

/**
 * Generate an editor scaffold from blueprint answers.
 * Pre-populates the editor with beat markers as SCENE_HEADING elements
 * and ACTION elements for notes/reminders.
 *
 * Exported as a pure function for property testing.
 */
export function generateScaffold(
  answers: Record<string, string>,
  beats: Beat[],
): ScreenplayElement[] {
  const elements: ScreenplayElement[] = [];
  let order = 0;

  for (const beat of beats) {
    const answer = answers[beat.id];
    if (!answer || !answer.trim()) continue;

    // Beat marker as SCENE_HEADING
    elements.push({
      id: `scaffold-heading-${beat.id}`,
      type: 'SCENE_HEADING',
      text: `${beat.name.toUpperCase()} — BEAT ${beat.beatOrder}`,
      order: order++,
    });

    // Answer notes as ACTION
    elements.push({
      id: `scaffold-action-${beat.id}`,
      type: 'ACTION',
      text: answer.trim(),
      order: order++,
    });
  }

  // If no elements were generated, add a default empty action
  if (elements.length === 0) {
    elements.push({
      id: 'scaffold-empty',
      type: 'ACTION',
      text: '',
      order: 0,
    });
  }

  return elements;
}
