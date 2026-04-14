import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '@/types/errors';

// Chainable query builder mock
function createQueryMock() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const self = () => chain;

  chain.select = vi.fn().mockReturnValue(self());
  chain.insert = vi.fn().mockReturnValue(self());
  chain.update = vi.fn().mockReturnValue(self());
  chain.delete = vi.fn().mockReturnValue(self());
  chain.eq = vi.fn().mockReturnValue(self());
  chain.order = vi.fn().mockReturnValue(self());
  chain.limit = vi.fn().mockReturnValue(self());
  chain.single = vi.fn().mockResolvedValue({ data: null, error: null });

  // Make the chain itself thenable so `await query` resolves
  (self() as any).then = (resolve: Function) =>
    chain.single().then((result: any) => resolve(result));

  return chain;
}

let queryMock = createQueryMock();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => {
      const self = () => queryMock;
      return {
        select: (...args: unknown[]) => { queryMock.select(...args); return self(); },
        insert: (...args: unknown[]) => { queryMock.insert(...args); return self(); },
        update: (...args: unknown[]) => { queryMock.update(...args); return self(); },
        delete: (...args: unknown[]) => { queryMock.delete(...args); return self(); },
        eq: (...args: unknown[]) => { queryMock.eq(...args); return self(); },
        order: (...args: unknown[]) => { queryMock.order(...args); return self(); },
        limit: (...args: unknown[]) => { queryMock.limit(...args); return self(); },
        single: () => queryMock.single(),
        then: (resolve: Function) => queryMock.single().then((r: any) => resolve(r)),
      };
    }),
  },
}));

import { ScriptRepository } from './ScriptRepository';

const fakeScriptRow = {
  id: 'script-1',
  user_id: 'user-1',
  title: 'My Script',
  elements: [],
  page_count: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const fakeVersionRow = {
  id: 'version-1',
  script_id: 'script-1',
  elements: [{ id: 'el-1', type: 'ACTION', text: 'Hello', order: 0 }],
  created_at: '2024-01-01T00:00:00Z',
};

describe('ScriptRepository', () => {
  let repo: ScriptRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    queryMock = createQueryMock();
  });

  beforeEach(() => {
    repo = new ScriptRepository();
  });

  describe('getScripts', () => {
    it('returns mapped scripts ordered by updated_at desc', async () => {
      queryMock.single.mockResolvedValue({ data: [fakeScriptRow], error: null });

      const scripts = await repo.getScripts('user-1');
      expect(scripts).toEqual([
        {
          id: 'script-1',
          userId: 'user-1',
          title: 'My Script',
          elements: [],
          pageCount: 0,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ]);
      expect(queryMock.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(queryMock.order).toHaveBeenCalledWith('updated_at', { ascending: false });
    });

    it('throws AppError on failure', async () => {
      queryMock.single.mockResolvedValue({ data: null, error: { message: 'DB error' } });

      await expect(repo.getScripts('user-1')).rejects.toThrow(AppError);
      await expect(repo.getScripts('user-1')).rejects.toMatchObject({
        code: 'SCRIPT_NOT_FOUND',
      });
    });
  });

  describe('getScript', () => {
    it('returns a single mapped script', async () => {
      queryMock.single.mockResolvedValue({ data: fakeScriptRow, error: null });

      const script = await repo.getScript('script-1');
      expect(script.id).toBe('script-1');
      expect(script.userId).toBe('user-1');
      expect(queryMock.eq).toHaveBeenCalledWith('id', 'script-1');
    });

    it('throws AppError when not found', async () => {
      queryMock.single.mockResolvedValue({ data: null, error: { message: 'Not found' } });

      await expect(repo.getScript('bad-id')).rejects.toMatchObject({
        code: 'SCRIPT_NOT_FOUND',
      });
    });
  });

  describe('createScript', () => {
    it('inserts and returns the created script', async () => {
      queryMock.single.mockResolvedValue({ data: fakeScriptRow, error: null });

      const script = await repo.createScript('user-1', 'My Script');
      expect(script.title).toBe('My Script');
      expect(queryMock.insert).toHaveBeenCalledWith({ user_id: 'user-1', title: 'My Script' });
    });

    it('throws AppError on insert failure', async () => {
      queryMock.single.mockResolvedValue({ data: null, error: { message: 'Insert failed' } });

      await expect(repo.createScript('user-1', 'Test')).rejects.toMatchObject({
        code: 'SCRIPT_SAVE_FAILED',
      });
    });
  });

  describe('updateScript', () => {
    it('updates with mapped fields and sets updated_at', async () => {
      queryMock.single.mockResolvedValue({ data: null, error: null });

      await repo.updateScript('script-1', { title: 'New Title', pageCount: 5 });
      expect(queryMock.update).toHaveBeenCalled();
      const updateArg = queryMock.update.mock.calls[0][0];
      expect(updateArg.title).toBe('New Title');
      expect(updateArg.page_count).toBe(5);
      expect(updateArg.updated_at).toBeDefined();
    });

    it('throws AppError on update failure', async () => {
      queryMock.single.mockResolvedValue({ data: null, error: { message: 'Update failed' } });

      await expect(repo.updateScript('script-1', { title: 'X' })).rejects.toMatchObject({
        code: 'SCRIPT_SAVE_FAILED',
      });
    });
  });

  describe('duplicateScript', () => {
    it('fetches original and inserts copy with " (Copy)" suffix', async () => {
      // First call: getScript (single), second call: insert+select (single)
      queryMock.single
        .mockResolvedValueOnce({ data: fakeScriptRow, error: null })
        .mockResolvedValueOnce({
          data: { ...fakeScriptRow, id: 'script-2', title: 'My Script (Copy)' },
          error: null,
        });

      const copy = await repo.duplicateScript('script-1');
      expect(copy.title).toBe('My Script (Copy)');
      expect(copy.id).toBe('script-2');
    });

    it('throws AppError when original not found', async () => {
      queryMock.single.mockResolvedValue({ data: null, error: { message: 'Not found' } });

      await expect(repo.duplicateScript('bad-id')).rejects.toThrow(AppError);
    });
  });

  describe('deleteScript', () => {
    it('deletes by id', async () => {
      queryMock.single.mockResolvedValue({ data: null, error: null });

      await expect(repo.deleteScript('script-1')).resolves.toBeUndefined();
      expect(queryMock.delete).toHaveBeenCalled();
      expect(queryMock.eq).toHaveBeenCalledWith('id', 'script-1');
    });

    it('throws AppError on delete failure', async () => {
      queryMock.single.mockResolvedValue({ data: null, error: { message: 'Delete failed' } });

      await expect(repo.deleteScript('script-1')).rejects.toMatchObject({
        code: 'SCRIPT_SAVE_FAILED',
      });
    });
  });

  describe('getVersions', () => {
    it('returns mapped versions ordered by created_at desc', async () => {
      queryMock.single.mockResolvedValue({ data: [fakeVersionRow], error: null });

      const versions = await repo.getVersions('script-1');
      expect(versions).toEqual([
        {
          id: 'version-1',
          scriptId: 'script-1',
          elements: [{ id: 'el-1', type: 'ACTION', text: 'Hello', order: 0 }],
          createdAt: '2024-01-01T00:00:00Z',
        },
      ]);
      expect(queryMock.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('applies limit when provided', async () => {
      queryMock.single.mockResolvedValue({ data: [], error: null });

      await repo.getVersions('script-1', 5);
      expect(queryMock.limit).toHaveBeenCalledWith(5);
    });

    it('throws AppError on failure', async () => {
      queryMock.single.mockResolvedValue({ data: null, error: { message: 'DB error' } });

      await expect(repo.getVersions('script-1')).rejects.toMatchObject({
        code: 'VERSION_NOT_FOUND',
      });
    });
  });

  describe('createVersion', () => {
    it('inserts and returns the created version', async () => {
      queryMock.single.mockResolvedValue({ data: fakeVersionRow, error: null });

      const version = await repo.createVersion('script-1', fakeVersionRow.elements as any);
      expect(version.scriptId).toBe('script-1');
      expect(queryMock.insert).toHaveBeenCalledWith({
        script_id: 'script-1',
        elements: fakeVersionRow.elements,
      });
    });

    it('throws AppError on failure', async () => {
      queryMock.single.mockResolvedValue({ data: null, error: { message: 'Insert failed' } });

      await expect(repo.createVersion('script-1', [])).rejects.toMatchObject({
        code: 'SCRIPT_SAVE_FAILED',
      });
    });
  });

  describe('restoreVersion', () => {
    it('fetches version and updates script elements', async () => {
      queryMock.single
        .mockResolvedValueOnce({ data: fakeVersionRow, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      await expect(repo.restoreVersion('script-1', 'version-1')).resolves.toBeUndefined();
    });

    it('throws AppError when version not found', async () => {
      queryMock.single.mockResolvedValue({ data: null, error: { message: 'Not found' } });

      await expect(repo.restoreVersion('script-1', 'bad-id')).rejects.toMatchObject({
        code: 'VERSION_NOT_FOUND',
      });
    });

    it('throws AppError when script update fails', async () => {
      queryMock.single
        .mockResolvedValueOnce({ data: fakeVersionRow, error: null })
        .mockResolvedValueOnce({ data: null, error: { message: 'Update failed' } });

      await expect(repo.restoreVersion('script-1', 'version-1')).rejects.toMatchObject({
        code: 'SCRIPT_SAVE_FAILED',
      });
    });
  });
});
