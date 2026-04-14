import type { Beat } from '@/types/blueprint';

/**
 * 5P Model beat definitions with specific prompts per section.
 * Used as static data when the 5P Model framework is selected.
 */

export interface FivePBeatPrompt {
  beatName: string;
  prompts: string[];
}

export const FIVE_P_BEATS: FivePBeatPrompt[] = [
  {
    beatName: 'Person',
    prompts: [
      'Who is your protagonist? What is their name?',
      'What is their core flaw — the thing holding them back?',
      'What wound from their past shaped this flaw?',
      'What do they desire more than anything?',
      'What are the stakes if they fail?',
      'What is their unique voice or way of speaking?',
      'What world do they inhabit at the start?',
    ],
  },
  {
    beatName: 'Problem',
    prompts: [
      'What is the central conflict your protagonist faces?',
      'Who or what is the opposition — the force working against them?',
      'Why is this problem urgent? What makes it impossible to ignore?',
    ],
  },
  {
    beatName: 'Plan',
    prompts: [
      "What is your character's strategy to solve the problem?",
      'What early actions do they take? What initial steps move the story forward?',
    ],
  },
  {
    beatName: 'Pivot',
    prompts: [
      'What is the midpoint turn that changes everything?',
      'What revelation or discovery shifts the story direction?',
      "How does the protagonist's identity or understanding shift?",
    ],
  },
  {
    beatName: 'Payoff',
    prompts: [
      'What is the climax — the final confrontation or decision?',
      'How has the protagonist transformed from who they were at the start?',
      'How does the story resolve? What is the new normal?',
    ],
  },
];

/**
 * Returns the 5P Model prompts for a given beat name.
 */
export function getFivePPromptsForBeat(beat: Beat): string[] {
  const match = FIVE_P_BEATS.find(
    (b) => b.beatName.toLowerCase() === beat.name.toLowerCase(),
  );
  return match?.prompts ?? [];
}
