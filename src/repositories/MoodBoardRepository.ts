import { supabase } from '@/lib/supabase';

import { AppError } from '@/types/errors';
import type {
  MoodBoard,
  MoodBoardImage,
  IMoodBoardRepository,
} from '@/types/productionTools';

interface MoodBoardRow {
  id: string;
  user_id: string;
  script_id: string | null;
  name: string;
  created_at: string;
  updated_at: string;
}

interface MoodBoardImageRow {
  id: string;
  mood_board_id: string;
  tmdb_image_path: string;
  tmdb_movie_id: number;
  note: string;
  tags: string;
  created_at: string;
  updated_at: string;
}

function mapBoard(row: MoodBoardRow): MoodBoard {
  return {
    id: row.id,
    userId: row.user_id,
    scriptId: row.script_id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapImage(row: MoodBoardImageRow): MoodBoardImage {
  return {
    id: row.id,
    moodBoardId: row.mood_board_id,
    tmdbImagePath: row.tmdb_image_path,
    tmdbMovieId: row.tmdb_movie_id,
    note: row.note,
    tags: row.tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class MoodBoardRepository implements IMoodBoardRepository {
  async getBoards(userId: string, scriptId?: string): Promise<MoodBoard[]> {
    let query = supabase
      .from('sw_mood_boards')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (scriptId !== undefined) {
      query = query.eq('script_id', scriptId);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError(
        error.message,
        'MOOD_BOARD_SAVE_FAILED',
        'Unable to load mood boards. Please try again.',
        true,
      );
    }

    return (data as MoodBoardRow[]).map(mapBoard);
  }

  async createBoard(
    board: Omit<MoodBoard, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<MoodBoard> {
    const { data, error } = await supabase
      .from('sw_mood_boards')
      .insert({
        user_id: board.userId,
        script_id: board.scriptId,
        name: board.name,
      })
      .select()
      .single();

    if (error) {
      throw new AppError(
        error.message,
        'MOOD_BOARD_SAVE_FAILED',
        'Unable to create mood board. Please try again.',
        true,
      );
    }

    return mapBoard(data as MoodBoardRow);
  }

  async deleteBoard(boardId: string): Promise<void> {
    const { error } = await supabase
      .from('sw_mood_boards')
      .delete()
      .eq('id', boardId);

    if (error) {
      throw new AppError(
        error.message,
        'MOOD_BOARD_SAVE_FAILED',
        'Unable to delete mood board. Please try again.',
      );
    }
  }

  async getImages(boardId: string): Promise<MoodBoardImage[]> {
    const { data, error } = await supabase
      .from('sw_mood_board_images')
      .select('*')
      .eq('mood_board_id', boardId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(
        error.message,
        'MOOD_BOARD_SAVE_FAILED',
        'Unable to load mood board images. Please try again.',
        true,
      );
    }

    return (data as MoodBoardImageRow[]).map(mapImage);
  }

  async saveImage(
    image: Omit<MoodBoardImage, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<MoodBoardImage> {
    const { data, error } = await supabase
      .from('sw_mood_board_images')
      .insert({
        mood_board_id: image.moodBoardId,
        tmdb_image_path: image.tmdbImagePath,
        tmdb_movie_id: image.tmdbMovieId,
        note: image.note,
        tags: image.tags,
      })
      .select()
      .single();

    if (error) {
      throw new AppError(
        error.message,
        'MOOD_BOARD_SAVE_FAILED',
        'Unable to save image to mood board. Please try again.',
        true,
      );
    }

    return mapImage(data as MoodBoardImageRow);
  }

  async updateImage(
    imageId: string,
    updates: Partial<MoodBoardImage>,
  ): Promise<void> {
    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (updates.note !== undefined) dbUpdates.note = updates.note;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;

    const { error } = await supabase
      .from('sw_mood_board_images')
      .update(dbUpdates)
      .eq('id', imageId);

    if (error) {
      throw new AppError(
        error.message,
        'MOOD_BOARD_SAVE_FAILED',
        'Unable to update mood board image. Please try again.',
        true,
      );
    }
  }

  async deleteImage(imageId: string): Promise<void> {
    const { error } = await supabase
      .from('sw_mood_board_images')
      .delete()
      .eq('id', imageId);

    if (error) {
      throw new AppError(
        error.message,
        'MOOD_BOARD_SAVE_FAILED',
        'Unable to delete mood board image. Please try again.',
      );
    }
  }
}
