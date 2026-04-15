import { supabase } from '@/lib/supabase';

import { AppError } from '@/types/errors';
import type {
  LightingDiagram,
  DiagramElement,
  ILightingDiagramRepository,
} from '@/types/productionTools';

interface LightingDiagramRow {
  id: string;
  user_id: string;
  script_id: string;
  scene_index: number;
  scene_heading: string;
  elements: DiagramElement[];
  canvas_width: number;
  canvas_height: number;
  created_at: string;
  updated_at: string;
}

function mapDiagram(row: LightingDiagramRow): LightingDiagram {
  return {
    id: row.id,
    userId: row.user_id,
    scriptId: row.script_id,
    sceneIndex: row.scene_index,
    sceneHeading: row.scene_heading,
    elements: row.elements,
    canvasWidth: row.canvas_width,
    canvasHeight: row.canvas_height,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class LightingDiagramRepository implements ILightingDiagramRepository {
  async getDiagram(scriptId: string, sceneIndex: number): Promise<LightingDiagram | null> {
    const { data, error } = await supabase
      .from('sw_lighting_diagrams')
      .select('*')
      .eq('script_id', scriptId)
      .eq('scene_index', sceneIndex)
      .maybeSingle();

    if (error) {
      throw new AppError(
        error.message,
        'DIAGRAM_SAVE_FAILED',
        'Unable to load lighting diagram. Please try again.',
        true,
      );
    }

    return data ? mapDiagram(data as LightingDiagramRow) : null;
  }

  async saveDiagram(
    diagram: Omit<LightingDiagram, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<LightingDiagram> {
    const { data, error } = await supabase
      .from('sw_lighting_diagrams')
      .upsert(
        {
          user_id: diagram.userId,
          script_id: diagram.scriptId,
          scene_index: diagram.sceneIndex,
          scene_heading: diagram.sceneHeading,
          elements: diagram.elements,
          canvas_width: diagram.canvasWidth,
          canvas_height: diagram.canvasHeight,
        },
        { onConflict: 'user_id,script_id,scene_index' },
      )
      .select()
      .single();

    if (error) {
      throw new AppError(
        error.message,
        'DIAGRAM_SAVE_FAILED',
        'Unable to save lighting diagram. Please try again.',
        true,
      );
    }

    return mapDiagram(data as LightingDiagramRow);
  }

  async updateDiagram(diagramId: string, elements: DiagramElement[]): Promise<void> {
    const { error } = await supabase
      .from('sw_lighting_diagrams')
      .update({ elements, updated_at: new Date().toISOString() })
      .eq('id', diagramId);

    if (error) {
      throw new AppError(
        error.message,
        'DIAGRAM_SAVE_FAILED',
        'Unable to update lighting diagram. Please try again.',
        true,
      );
    }
  }
}
