import { supabase } from '@/lib/supabase';
import { AppError } from '@/types/errors';
import type { BeatPrompt, BeatExample } from '@/types/blueprint';
import type { ISuggestionEngine } from '@/types/services';

interface PromptRow {
  id: string;
  framework_id: string;
  beat_id: string;
  genre: string | null;
  story_type: string | null;
  prompt_text: string;
  sort_order: number;
}

interface ExampleRow {
  id: string;
  framework_id: string;
  beat_id: string;
  genre: string | null;
  example_text: string;
  source_title: string | null;
  sort_order: number;
}

function mapPrompt(row: PromptRow): BeatPrompt {
  return {
    id: row.id,
    frameworkId: row.framework_id,
    beatId: row.beat_id,
    genre: row.genre,
    storyType: row.story_type,
    promptText: row.prompt_text,
    sortOrder: row.sort_order,
  };
}

function mapExample(row: ExampleRow): BeatExample {
  return {
    id: row.id,
    frameworkId: row.framework_id,
    beatId: row.beat_id,
    genre: row.genre,
    exampleText: row.example_text,
    sourceTitle: row.source_title,
    sortOrder: row.sort_order,
  };
}

/**
 * Pure query layer for beat prompts and examples — no AI/LLM.
 * Exported pure filter functions for property testing.
 */

export function filterPrompts(
  prompts: BeatPrompt[],
  frameworkId: string,
  beatId: string,
  genre: string,
  storyType: string,
): BeatPrompt[] {
  return prompts.filter(
    (p) =>
      p.frameworkId === frameworkId &&
      p.beatId === beatId &&
      (p.genre === genre || p.genre === null) &&
      (p.storyType === storyType || p.storyType === null),
  );
}

export function filterFallbackPrompts(
  prompts: BeatPrompt[],
  frameworkId: string,
  beatId: string,
): BeatPrompt[] {
  return prompts.filter(
    (p) =>
      p.frameworkId === frameworkId &&
      p.beatId === beatId &&
      p.genre === null &&
      p.storyType === null,
  );
}

export function filterExamples(
  examples: BeatExample[],
  frameworkId: string,
  beatId: string,
  genre: string,
): BeatExample[] {
  return examples.filter(
    (e) =>
      e.frameworkId === frameworkId &&
      e.beatId === beatId &&
      (e.genre === genre || e.genre === null),
  );
}

export class SuggestionEngine implements ISuggestionEngine {
  async getPrompts(
    frameworkId: string,
    beatId: string,
    genre: string,
    storyType: string,
  ): Promise<BeatPrompt[]> {
    const { data, error } = await supabase
      .from('sw_beat_prompts')
      .select('*')
      .eq('framework_id', frameworkId)
      .eq('beat_id', beatId)
      .or(`genre.eq.${genre},genre.is.null`)
      .or(`story_type.eq.${storyType},story_type.is.null`)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new AppError(
        error.message,
        'SUGGESTION_FETCH_FAILED',
        'Unable to load prompts. Please try again.',
        true,
      );
    }

    return (data as PromptRow[]).map(mapPrompt);
  }

  async getExamples(
    frameworkId: string,
    beatId: string,
    genre: string,
  ): Promise<BeatExample[]> {
    const { data, error } = await supabase
      .from('sw_beat_examples')
      .select('*')
      .eq('framework_id', frameworkId)
      .eq('beat_id', beatId)
      .or(`genre.eq.${genre},genre.is.null`)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new AppError(
        error.message,
        'SUGGESTION_FETCH_FAILED',
        'Unable to load examples. Please try again.',
        true,
      );
    }

    return (data as ExampleRow[]).map(mapExample);
  }

  async getFallbackPrompts(
    frameworkId: string,
    beatId: string,
  ): Promise<BeatPrompt[]> {
    const { data, error } = await supabase
      .from('sw_beat_prompts')
      .select('*')
      .eq('framework_id', frameworkId)
      .eq('beat_id', beatId)
      .is('genre', null)
      .is('story_type', null)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new AppError(
        error.message,
        'SUGGESTION_FETCH_FAILED',
        'Unable to load fallback prompts. Please try again.',
        true,
      );
    }

    return (data as PromptRow[]).map(mapPrompt);
  }
}
