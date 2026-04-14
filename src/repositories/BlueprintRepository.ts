import { supabase } from '@/lib/supabase';
import { AppError } from '@/types/errors';
import type {
  Framework,
  Beat,
  OutlineSession,
  OutlineAnswer,
} from '@/types/blueprint';
import type { IBlueprintRepository } from '@/types/repositories';

interface FrameworkRow {
  id: string;
  name: string;
  description: string;
  beat_count: number;
  sort_order: number;
  is_default: boolean;
}

interface BeatRow {
  id: string;
  framework_id: string;
  name: string;
  description: string;
  beat_order: number;
  page_range_start: number | null;
  page_range_end: number | null;
}

interface SessionRow {
  id: string;
  user_id: string;
  framework_id: string;
  genre: string;
  format: string;
  tone: string;
  status: 'in_progress' | 'completed';
  created_at: string;
  completed_at: string | null;
}

interface AnswerRow {
  id: string;
  session_id: string;
  beat_id: string;
  answer_text: string;
  created_at: string;
  updated_at: string;
}

function mapFramework(row: FrameworkRow): Framework {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    beatCount: row.beat_count,
    sortOrder: row.sort_order,
    isDefault: row.is_default,
  };
}

function mapBeat(row: BeatRow): Beat {
  return {
    id: row.id,
    frameworkId: row.framework_id,
    name: row.name,
    description: row.description,
    beatOrder: row.beat_order,
    pageRangeStart: row.page_range_start,
    pageRangeEnd: row.page_range_end,
  };
}

function mapSession(row: SessionRow): OutlineSession {
  return {
    id: row.id,
    userId: row.user_id,
    frameworkId: row.framework_id,
    genre: row.genre,
    format: row.format,
    tone: row.tone,
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

function mapAnswer(row: AnswerRow): OutlineAnswer {
  return {
    id: row.id,
    sessionId: row.session_id,
    beatId: row.beat_id,
    answerText: row.answer_text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class BlueprintRepository implements IBlueprintRepository {
  async getFrameworks(): Promise<Framework[]> {
    const { data, error } = await supabase
      .from('sw_frameworks')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      throw new AppError(
        error.message,
        'BLUEPRINT_SAVE_FAILED',
        'Unable to load frameworks. Please try again.',
        true,
      );
    }

    return (data as FrameworkRow[]).map(mapFramework);
  }

  async getFrameworkBeats(frameworkId: string): Promise<Beat[]> {
    const { data, error } = await supabase
      .from('sw_framework_beats')
      .select('*')
      .eq('framework_id', frameworkId)
      .order('beat_order', { ascending: true });

    if (error) {
      throw new AppError(
        error.message,
        'BLUEPRINT_SAVE_FAILED',
        'Unable to load framework beats. Please try again.',
        true,
      );
    }

    return (data as BeatRow[]).map(mapBeat);
  }

  async createOutlineSession(
    session: Omit<OutlineSession, 'id'>,
  ): Promise<OutlineSession> {
    const { data, error } = await supabase
      .from('sw_outline_sessions')
      .insert({
        user_id: session.userId,
        framework_id: session.frameworkId,
        genre: session.genre,
        format: session.format,
        tone: session.tone,
        status: session.status,
        created_at: session.createdAt,
        completed_at: session.completedAt,
      })
      .select()
      .single();

    if (error) {
      throw new AppError(
        error.message,
        'BLUEPRINT_SAVE_FAILED',
        'Unable to create outline session. Please try again.',
        true,
      );
    }

    return mapSession(data as SessionRow);
  }

  async saveOutlineAnswer(answer: Omit<OutlineAnswer, 'id'>): Promise<void> {
    const { error } = await supabase.from('sw_outline_answers').upsert(
      {
        session_id: answer.sessionId,
        beat_id: answer.beatId,
        answer_text: answer.answerText,
        created_at: answer.createdAt,
        updated_at: answer.updatedAt,
      },
      { onConflict: 'session_id,beat_id' },
    );

    if (error) {
      throw new AppError(
        error.message,
        'BLUEPRINT_SAVE_FAILED',
        'Unable to save answer. Please try again.',
        true,
      );
    }
  }

  async getOutlineSession(sessionId: string): Promise<OutlineSession> {
    const { data, error } = await supabase
      .from('sw_outline_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      throw new AppError(
        error.message,
        'BLUEPRINT_SAVE_FAILED',
        'Outline session not found.',
      );
    }

    return mapSession(data as SessionRow);
  }

  async getOutlineAnswers(sessionId: string): Promise<OutlineAnswer[]> {
    const { data, error } = await supabase
      .from('sw_outline_answers')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new AppError(
        error.message,
        'BLUEPRINT_SAVE_FAILED',
        'Unable to load answers. Please try again.',
        true,
      );
    }

    return (data as AnswerRow[]).map(mapAnswer);
  }
}
