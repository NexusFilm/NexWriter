import { supabase } from '@/lib/supabase';

import { AppError } from '@/types/errors';
import type {
  AgreementTemplate,
  AgreementInstance,
  IAgreementRepository,
  TemplateField,
} from '@/types/productionTools';

interface AgreementTemplateRow {
  id: string;
  user_id: string | null;
  template_type: AgreementTemplate['templateType'];
  name: string;
  fields: TemplateField[];
  storage_path: string | null;
  created_at: string;
}

interface AgreementInstanceRow {
  id: string;
  user_id: string;
  template_id: string;
  field_values: Record<string, string>;
  signature_path: string | null;
  status: AgreementInstance['status'];
  created_at: string;
  updated_at: string;
}

function mapTemplate(row: AgreementTemplateRow): AgreementTemplate {
  return {
    id: row.id,
    userId: row.user_id,
    templateType: row.template_type,
    name: row.name,
    fields: row.fields,
    storagePath: row.storage_path,
    createdAt: row.created_at,
  };
}

function mapInstance(row: AgreementInstanceRow): AgreementInstance {
  return {
    id: row.id,
    userId: row.user_id,
    templateId: row.template_id,
    fieldValues: row.field_values,
    signaturePath: row.signature_path,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class AgreementRepository implements IAgreementRepository {
  async getTemplates(userId: string): Promise<AgreementTemplate[]> {
    const { data, error } = await supabase
      .from('sw_agreement_templates')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .order('created_at', { ascending: true });

    if (error) {
      throw new AppError(
        error.message,
        'AGREEMENT_SAVE_FAILED',
        'Unable to load agreement templates. Please try again.',
        true,
      );
    }

    return (data as AgreementTemplateRow[]).map(mapTemplate);
  }

  async createTemplate(
    template: Omit<AgreementTemplate, 'id' | 'createdAt'>,
  ): Promise<AgreementTemplate> {
    const { data, error } = await supabase
      .from('sw_agreement_templates')
      .insert({
        user_id: template.userId,
        template_type: template.templateType,
        name: template.name,
        fields: template.fields,
        storage_path: template.storagePath,
      })
      .select()
      .single();

    if (error) {
      throw new AppError(
        error.message,
        'AGREEMENT_SAVE_FAILED',
        'Unable to create agreement template. Please try again.',
        true,
      );
    }

    return mapTemplate(data as AgreementTemplateRow);
  }

  async getInstances(userId: string): Promise<AgreementInstance[]> {
    const { data, error } = await supabase
      .from('sw_agreement_instances')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new AppError(
        error.message,
        'AGREEMENT_SAVE_FAILED',
        'Unable to load agreement instances. Please try again.',
        true,
      );
    }

    return (data as AgreementInstanceRow[]).map(mapInstance);
  }

  async getInstance(instanceId: string): Promise<AgreementInstance> {
    const { data, error } = await supabase
      .from('sw_agreement_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (error) {
      throw new AppError(
        error.message,
        'AGREEMENT_SAVE_FAILED',
        'Unable to load agreement instance. Please try again.',
        true,
      );
    }

    return mapInstance(data as AgreementInstanceRow);
  }

  async createInstance(
    instance: Omit<AgreementInstance, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<AgreementInstance> {
    const { data, error } = await supabase
      .from('sw_agreement_instances')
      .insert({
        user_id: instance.userId,
        template_id: instance.templateId,
        field_values: instance.fieldValues,
        signature_path: instance.signaturePath,
        status: instance.status,
      })
      .select()
      .single();

    if (error) {
      throw new AppError(
        error.message,
        'AGREEMENT_SAVE_FAILED',
        'Unable to create agreement instance. Please try again.',
        true,
      );
    }

    return mapInstance(data as AgreementInstanceRow);
  }

  async updateInstance(
    instanceId: string,
    updates: Partial<AgreementInstance>,
  ): Promise<void> {
    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (updates.fieldValues !== undefined) dbUpdates.field_values = updates.fieldValues;
    if (updates.signaturePath !== undefined) dbUpdates.signature_path = updates.signaturePath;
    if (updates.status !== undefined) dbUpdates.status = updates.status;

    const { error } = await supabase
      .from('sw_agreement_instances')
      .update(dbUpdates)
      .eq('id', instanceId);

    if (error) {
      throw new AppError(
        error.message,
        'AGREEMENT_SAVE_FAILED',
        'Unable to update agreement instance. Please try again.',
        true,
      );
    }
  }
}
