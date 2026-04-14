import { supabase } from '@/lib/supabase';

import { AppError } from '@/types/errors';
import type { Script, ScriptVersion, ScreenplayElement } from '@/types/screenplay';
import type { IScriptRepository } from '@/types/repositories';
import { duplicateTitle } from '@/utils/duplicateTitle';

interface ScriptRow {
  id: string;
  user_id: string;
  title: string;
  elements: ScreenplayElement[];
  page_count: number;
  created_at: string;
  updated_at: string;
}

interface VersionRow {
  id: string;
  script_id: string;
  elements: ScreenplayElement[];
  created_at: string;
}

function mapScript(row: ScriptRow): Script {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    elements: row.elements,
    pageCount: row.page_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapVersion(row: VersionRow): ScriptVersion {
  return {
    id: row.id,
    scriptId: row.script_id,
    elements: row.elements,
    createdAt: row.created_at,
  };
}

export class ScriptRepository implements IScriptRepository {
  async getScripts(userId: string): Promise<Script[]> {
    const { data, error } = await supabase
      .from('sw_scripts')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new AppError(
        error.message,
        'SCRIPT_NOT_FOUND',
        'Unable to load scripts. Please try again.',
        true,
      );
    }

    return (data as ScriptRow[]).map(mapScript);
  }

  async getScript(scriptId: string): Promise<Script> {
    const { data, error } = await supabase
      .from('sw_scripts')
      .select('*')
      .eq('id', scriptId)
      .single();

    if (error) {
      throw new AppError(
        error.message,
        'SCRIPT_NOT_FOUND',
        'Script not found. It may have been deleted.',
      );
    }

    return mapScript(data as ScriptRow);
  }

  async createScript(userId: string, title: string): Promise<Script> {
    const { data, error } = await supabase
      .from('sw_scripts')
      .insert({ user_id: userId, title })
      .select()
      .single();

    if (error) {
      throw new AppError(
        error.message,
        'SCRIPT_SAVE_FAILED',
        'Unable to create script. Please try again.',
        true,
      );
    }

    return mapScript(data as ScriptRow);
  }

  async updateScript(scriptId: string, updates: Partial<Script>): Promise<void> {
    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.elements !== undefined) dbUpdates.elements = updates.elements;
    if (updates.pageCount !== undefined) dbUpdates.page_count = updates.pageCount;

    const { error } = await supabase
      .from('sw_scripts')
      .update(dbUpdates)
      .eq('id', scriptId);

    if (error) {
      throw new AppError(
        error.message,
        'SCRIPT_SAVE_FAILED',
        'Unable to save script changes. Please try again.',
        true,
      );
    }
  }

  async duplicateScript(scriptId: string): Promise<Script> {
    const original = await this.getScript(scriptId);

    const { data, error } = await supabase
      .from('sw_scripts')
      .insert({
        user_id: original.userId,
        title: duplicateTitle(original.title),
        elements: original.elements,
        page_count: original.pageCount,
      })
      .select()
      .single();

    if (error) {
      throw new AppError(
        error.message,
        'SCRIPT_SAVE_FAILED',
        'Unable to duplicate script. Please try again.',
        true,
      );
    }

    return mapScript(data as ScriptRow);
  }

  async deleteScript(scriptId: string): Promise<void> {
    const { error } = await supabase
      .from('sw_scripts')
      .delete()
      .eq('id', scriptId);

    if (error) {
      throw new AppError(
        error.message,
        'SCRIPT_SAVE_FAILED',
        'Unable to delete script. Please try again.',
      );
    }
  }

  async getVersions(scriptId: string, limit?: number): Promise<ScriptVersion[]> {
    let query = supabase
      .from('sw_script_versions')
      .select('*')
      .eq('script_id', scriptId)
      .order('created_at', { ascending: false });

    if (limit !== undefined) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError(
        error.message,
        'VERSION_NOT_FOUND',
        'Unable to load version history. Please try again.',
        true,
      );
    }

    return (data as VersionRow[]).map(mapVersion);
  }

  async createVersion(scriptId: string, elements: ScreenplayElement[]): Promise<ScriptVersion> {
    const { data, error } = await supabase
      .from('sw_script_versions')
      .insert({ script_id: scriptId, elements })
      .select()
      .single();

    if (error) {
      throw new AppError(
        error.message,
        'SCRIPT_SAVE_FAILED',
        'Unable to create version snapshot. Please try again.',
        true,
      );
    }

    return mapVersion(data as VersionRow);
  }

  async restoreVersion(scriptId: string, versionId: string): Promise<void> {
    const { data: versionData, error: versionError } = await supabase
      .from('sw_script_versions')
      .select('*')
      .eq('id', versionId)
      .single();

    if (versionError) {
      throw new AppError(
        versionError.message,
        'VERSION_NOT_FOUND',
        'Version not found. It may have been deleted.',
      );
    }

    const version = versionData as VersionRow;

    const { error: updateError } = await supabase
      .from('sw_scripts')
      .update({
        elements: version.elements,
        updated_at: new Date().toISOString(),
      })
      .eq('id', scriptId);

    if (updateError) {
      throw new AppError(
        updateError.message,
        'SCRIPT_SAVE_FAILED',
        'Unable to restore version. Please try again.',
        true,
      );
    }
  }
}
