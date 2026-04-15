import { supabase } from '@/lib/supabase';

import { AppError } from '@/types/errors';
import type { ShotList, ShotEntry, IShotListRepository } from '@/types/productionTools';

interface ShotListRow {
  id: string;
  user_id: string;
  script_id: string | null;
  scene_heading: string | null;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ShotEntryRow {
  id: string;
  shot_list_id: string;
  shot_number: number;
  shot_type: ShotEntry['shotType'];
  description: string;
  camera_angle: string;
  camera_movement: string;
  lens: string;
  camera_designation: string;
  notes: string;
  reference_image_path: string | null;
  shot_order: number;
  created_at: string;
  updated_at: string;
}

function mapShotList(row: ShotListRow): ShotList {
  return {
    id: row.id,
    userId: row.user_id,
    scriptId: row.script_id,
    sceneHeading: row.scene_heading,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapShotEntry(row: ShotEntryRow): ShotEntry {
  return {
    id: row.id,
    shotListId: row.shot_list_id,
    shotNumber: row.shot_number,
    shotType: row.shot_type,
    description: row.description,
    cameraAngle: row.camera_angle,
    cameraMovement: row.camera_movement,
    lens: row.lens,
    cameraDesignation: row.camera_designation,
    notes: row.notes,
    referenceImagePath: row.reference_image_path,
    shotOrder: row.shot_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ShotListRepository implements IShotListRepository {
  async getShotLists(userId: string, scriptId?: string): Promise<ShotList[]> {
    let query = supabase
      .from('sw_shot_lists')
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
        'SHOT_LIST_SAVE_FAILED',
        'Unable to load shot lists. Please try again.',
        true,
      );
    }

    return (data as ShotListRow[]).map(mapShotList);
  }

  async createShotList(list: Omit<ShotList, 'id' | 'createdAt' | 'updatedAt'>): Promise<ShotList> {
    const { data, error } = await supabase
      .from('sw_shot_lists')
      .insert({
        user_id: list.userId,
        script_id: list.scriptId,
        scene_heading: list.sceneHeading,
        title: list.title,
      })
      .select()
      .single();

    if (error) {
      throw new AppError(
        error.message,
        'SHOT_LIST_SAVE_FAILED',
        'Unable to create shot list. Please try again.',
        true,
      );
    }

    return mapShotList(data as ShotListRow);
  }

  async deleteShotList(listId: string): Promise<void> {
    const { error } = await supabase
      .from('sw_shot_lists')
      .delete()
      .eq('id', listId);

    if (error) {
      throw new AppError(
        error.message,
        'SHOT_LIST_SAVE_FAILED',
        'Unable to delete shot list. Please try again.',
      );
    }
  }

  async getShotEntries(shotListId: string): Promise<ShotEntry[]> {
    const { data, error } = await supabase
      .from('sw_shot_entries')
      .select('*')
      .eq('shot_list_id', shotListId)
      .order('shot_order', { ascending: true });

    if (error) {
      throw new AppError(
        error.message,
        'SHOT_LIST_SAVE_FAILED',
        'Unable to load shot entries. Please try again.',
        true,
      );
    }

    return (data as ShotEntryRow[]).map(mapShotEntry);
  }

  async insertShotEntry(entry: Omit<ShotEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<ShotEntry> {
    const { data, error } = await supabase
      .from('sw_shot_entries')
      .insert({
        shot_list_id: entry.shotListId,
        shot_number: entry.shotNumber,
        shot_type: entry.shotType,
        description: entry.description,
        camera_angle: entry.cameraAngle,
        camera_movement: entry.cameraMovement,
        lens: entry.lens,
        camera_designation: entry.cameraDesignation,
        notes: entry.notes,
        reference_image_path: entry.referenceImagePath,
        shot_order: entry.shotOrder,
      })
      .select()
      .single();

    if (error) {
      throw new AppError(
        error.message,
        'SHOT_LIST_SAVE_FAILED',
        'Unable to add shot entry. Please try again.',
        true,
      );
    }

    return mapShotEntry(data as ShotEntryRow);
  }

  async updateShotEntry(entryId: string, updates: Partial<ShotEntry>): Promise<void> {
    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (updates.shotNumber !== undefined) dbUpdates.shot_number = updates.shotNumber;
    if (updates.shotType !== undefined) dbUpdates.shot_type = updates.shotType;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.cameraAngle !== undefined) dbUpdates.camera_angle = updates.cameraAngle;
    if (updates.cameraMovement !== undefined) dbUpdates.camera_movement = updates.cameraMovement;
    if (updates.lens !== undefined) dbUpdates.lens = updates.lens;
    if (updates.cameraDesignation !== undefined) dbUpdates.camera_designation = updates.cameraDesignation;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.referenceImagePath !== undefined) dbUpdates.reference_image_path = updates.referenceImagePath;
    if (updates.shotOrder !== undefined) dbUpdates.shot_order = updates.shotOrder;

    const { error } = await supabase
      .from('sw_shot_entries')
      .update(dbUpdates)
      .eq('id', entryId);

    if (error) {
      throw new AppError(
        error.message,
        'SHOT_LIST_SAVE_FAILED',
        'Unable to update shot entry. Please try again.',
        true,
      );
    }
  }

  async deleteShotEntry(entryId: string): Promise<void> {
    const { error } = await supabase
      .from('sw_shot_entries')
      .delete()
      .eq('id', entryId);

    if (error) {
      throw new AppError(
        error.message,
        'SHOT_LIST_SAVE_FAILED',
        'Unable to delete shot entry. Please try again.',
      );
    }
  }

  async reorderShotEntries(shotListId: string, orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await supabase
        .from('sw_shot_entries')
        .update({ shot_order: i, updated_at: new Date().toISOString() })
        .eq('id', orderedIds[i])
        .eq('shot_list_id', shotListId);

      if (error) {
        throw new AppError(
          error.message,
          'SHOT_LIST_SAVE_FAILED',
          'Unable to reorder shot entries. Please try again.',
          true,
        );
      }
    }
  }
}
