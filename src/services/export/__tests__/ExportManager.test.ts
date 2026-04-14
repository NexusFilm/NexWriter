import { describe, it, expect } from 'vitest';
import { ExportManager } from '../ExportManager';
import type { Script } from '@/types/screenplay';
import { AppError } from '@/types/errors';

const mockScript: Script = {
  id: 'script-1',
  userId: 'user-1',
  title: 'Test Script',
  elements: [
    { id: '1', type: 'SCENE_HEADING', text: 'INT. OFFICE - DAY', order: 0 },
    { id: '2', type: 'ACTION', text: 'John walks in.', order: 1 },
    { id: '3', type: 'CHARACTER', text: 'JOHN', order: 2 },
    { id: '4', type: 'DIALOGUE', text: 'Hello.', order: 3 },
  ],
  pageCount: 1,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('ExportManager', () => {
  describe('tier gating', () => {
    it('allows PDF export for free tier', async () => {
      const manager = new ExportManager('free');
      const blob = await manager.exportPDF(mockScript);
      expect(blob).toBeInstanceOf(Blob);
    });

    it('throws on FDX export for free tier', async () => {
      const manager = new ExportManager('free');
      await expect(manager.exportFDX(mockScript)).rejects.toThrow(AppError);
    });

    it('throws on Fountain export for free tier', async () => {
      const manager = new ExportManager('free');
      await expect(manager.exportFountain(mockScript)).rejects.toThrow(AppError);
    });

    it('allows FDX export for writer tier', async () => {
      const manager = new ExportManager('writer');
      const result = await manager.exportFDX(mockScript);
      expect(typeof result).toBe('string');
      expect(result).toContain('<FinalDraft');
    });

    it('allows Fountain export for pro tier', async () => {
      const manager = new ExportManager('pro');
      const result = await manager.exportFountain(mockScript);
      expect(typeof result).toBe('string');
    });
  });

  describe('setTier', () => {
    it('updates tier and allows previously gated exports', async () => {
      const manager = new ExportManager('free');
      await expect(manager.exportFDX(mockScript)).rejects.toThrow();
      manager.setTier('writer');
      const result = await manager.exportFDX(mockScript);
      expect(result).toContain('<FinalDraft');
    });
  });

  describe('parseFountain', () => {
    it('delegates to fountainExport.parseFountain', () => {
      const manager = new ExportManager('free');
      const result = manager.parseFountain('INT. OFFICE - DAY');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('SCENE_HEADING');
    });
  });

  describe('parseFDX', () => {
    it('delegates to fdxExport.parseFDX', () => {
      const manager = new ExportManager('free');
      const fdx = `<?xml version="1.0" encoding="UTF-8"?>
<FinalDraft DocumentType="Script" Template="No" Version="1">
  <Content>
    <Paragraph Type="Scene Heading" ElementId="1" ElementType="SCENE_HEADING" Order="0">
      <Text>INT. OFFICE - DAY</Text>
    </Paragraph>
  </Content>
</FinalDraft>`;
      const result = manager.parseFDX(fdx);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('SCENE_HEADING');
    });
  });
});
