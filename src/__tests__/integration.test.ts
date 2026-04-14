import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ScreenplayElement, Script, ScriptVersion } from '@/types/screenplay';
import type { IScriptRepository } from '@/types/repositories';
import type { Tier } from '@/types/subscription';
import { AutosaveManager, resolveConflictPure } from '@/services/AutosaveManager';
import { AppError } from '@/types/errors';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeElement(overrides: Partial<ScreenplayElement> = {}): ScreenplayElement {
  return { id: 'el-1', type: 'ACTION', text: 'Hello', order: 0, ...overrides };
}

function makeScript(overrides: Partial<Script> = {}): Script {
  return {
    id: 'script-1',
    userId: 'user-1',
    title: 'Test Script',
    elements: [makeElement()],
    pageCount: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T12:00:00Z',
    ...overrides,
  };
}

// ─── Mock Supabase (shared across repository tests) ─────────────────────────

function createQueryMock() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const self = () => chain;

  chain.select = vi.fn().mockReturnValue(self());
  chain.insert = vi.fn().mockReturnValue(self());
  chain.update = vi.fn().mockReturnValue(self());
  chain.delete = vi.fn().mockReturnValue(self());
  chain.upsert = vi.fn().mockReturnValue(self());
  chain.eq = vi.fn().mockReturnValue(self());
  chain.order = vi.fn().mockReturnValue(self());
  chain.limit = vi.fn().mockReturnValue(self());
  chain.single = vi.fn().mockResolvedValue({ data: null, error: null });

  (self() as any).then = (resolve: Function) =>
    chain.single().then((result: any) => resolve(result));

  return chain;
}

let queryMock = createQueryMock();

const mockSignUp = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => {
      const self = () => queryMock;
      return {
        select: (...a: unknown[]) => { queryMock.select(...a); return self(); },
        insert: (...a: unknown[]) => { queryMock.insert(...a); return self(); },
        update: (...a: unknown[]) => { queryMock.update(...a); return self(); },
        delete: (...a: unknown[]) => { queryMock.delete(...a); return self(); },
        upsert: (...a: unknown[]) => { queryMock.upsert(...a); return self(); },
        eq: (...a: unknown[]) => { queryMock.eq(...a); return self(); },
        order: (...a: unknown[]) => { queryMock.order(...a); return self(); },
        limit: (...a: unknown[]) => { queryMock.limit(...a); return self(); },
        single: () => queryMock.single(),
        then: (resolve: Function) => queryMock.single().then((r: any) => resolve(r)),
      };
    }),
    auth: {
      signUp: (...a: unknown[]) => mockSignUp(...a),
      signInWithPassword: (...a: unknown[]) => mockSignInWithPassword(...a),
      signOut: (...a: unknown[]) => mockSignOut(...a),
      getSession: (...a: unknown[]) => mockGetSession(...a),
      onAuthStateChange: (...a: unknown[]) => mockOnAuthStateChange(...a),
    },
  },
}));

import { ScriptRepository } from '@/repositories/ScriptRepository';
import { AuthRepository } from '@/repositories/AuthRepository';
import { BlueprintRepository } from '@/repositories/BlueprintRepository';

// ─── localStorage mock ──────────────────────────────────────────────────────

function createLocalStorageMock() {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]); }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
    _store: store,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. ScriptRepository CRUD integration
// ═══════════════════════════════════════════════════════════════════════════

describe('Integration: ScriptRepository CRUD flow', () => {
  let repo: ScriptRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    queryMock = createQueryMock();
    repo = new ScriptRepository();
  });

  it('create → read → update → delete lifecycle', async () => {
    const created = { ...makeScript(), id: 'new-1', title: 'My Film' };

    // Create
    queryMock.single.mockResolvedValueOnce({
      data: { id: created.id, user_id: created.userId, title: created.title, elements: [], page_count: 0, created_at: created.createdAt, updated_at: created.updatedAt },
      error: null,
    });
    const script = await repo.createScript('user-1', 'My Film');
    expect(script.title).toBe('My Film');

    // Read
    queryMock.single.mockResolvedValueOnce({
      data: { id: script.id, user_id: 'user-1', title: 'My Film', elements: [], page_count: 0, created_at: script.createdAt, updated_at: script.updatedAt },
      error: null,
    });
    const fetched = await repo.getScript(script.id);
    expect(fetched.id).toBe(script.id);

    // Update
    queryMock.single.mockResolvedValueOnce({ data: null, error: null });
    await repo.updateScript(script.id, { title: 'My Film v2' });
    expect(queryMock.update).toHaveBeenCalled();

    // Delete
    queryMock.single.mockResolvedValueOnce({ data: null, error: null });
    await repo.deleteScript(script.id);
    expect(queryMock.delete).toHaveBeenCalled();
  });

  it('version create and restore flow', async () => {
    const elements: ScreenplayElement[] = [makeElement({ text: 'Scene 1' })];

    // Create version
    queryMock.single.mockResolvedValueOnce({
      data: { id: 'v-1', script_id: 'script-1', elements, created_at: '2024-06-01T00:00:00Z' },
      error: null,
    });
    const version = await repo.createVersion('script-1', elements);
    expect(version.scriptId).toBe('script-1');

    // Restore version (fetch version then update script)
    queryMock.single
      .mockResolvedValueOnce({ data: { id: 'v-1', script_id: 'script-1', elements, created_at: '2024-06-01T00:00:00Z' }, error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    await repo.restoreVersion('script-1', 'v-1');
    expect(queryMock.update).toHaveBeenCalled();
  });

  it('propagates errors as AppError', async () => {
    queryMock.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });
    await expect(repo.getScript('bad-id')).rejects.toThrow(AppError);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. AuthRepository sign-in/sign-up integration
// ═══════════════════════════════════════════════════════════════════════════

describe('Integration: AuthRepository sign-up → sign-in → sign-out', () => {
  let repo: AuthRepository;
  const fakeUser = { id: 'user-1', email: 'test@example.com', aud: 'authenticated', created_at: '2024-01-01', app_metadata: {}, user_metadata: {} };

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new AuthRepository();
  });

  it('sign-up then sign-in then sign-out flow', async () => {
    // Sign up
    mockSignUp.mockResolvedValueOnce({ data: { user: fakeUser }, error: null });
    const user = await repo.signUp('test@example.com', 'pass123');
    expect(user.id).toBe('user-1');

    // Sign in
    mockSignInWithPassword.mockResolvedValueOnce({ data: { user: fakeUser }, error: null });
    const signedIn = await repo.signIn('test@example.com', 'pass123');
    expect(signedIn.id).toBe('user-1');

    // Sign out
    mockSignOut.mockResolvedValueOnce({ error: null });
    await expect(repo.signOut()).resolves.toBeUndefined();
  });

  it('sign-in with bad credentials throws AppError', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    });
    await expect(repo.signIn('bad@example.com', 'wrong')).rejects.toThrow(AppError);
  });

  it('session retrieval after sign-in', async () => {
    const fakeSession = { access_token: 'tok', user: fakeUser };
    mockGetSession.mockResolvedValueOnce({ data: { session: fakeSession }, error: null });
    const session = await repo.getSession();
    expect(session).toEqual(fakeSession);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. AutosaveManager Layer 2 cloud sync with mock repository
// ═══════════════════════════════════════════════════════════════════════════

describe('Integration: AutosaveManager cloud sync flow', () => {
  let mockRepo: IScriptRepository;
  let tier: Tier;
  let manager: AutosaveManager;
  let storageMock: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    vi.useFakeTimers();
    storageMock = createLocalStorageMock();
    Object.defineProperty(globalThis, 'localStorage', { value: storageMock, writable: true, configurable: true });

    mockRepo = {
      getScripts: vi.fn(),
      getScript: vi.fn().mockResolvedValue(makeScript()),
      createScript: vi.fn(),
      updateScript: vi.fn().mockResolvedValue(undefined),
      duplicateScript: vi.fn(),
      deleteScript: vi.fn(),
      getVersions: vi.fn(),
      createVersion: vi.fn().mockResolvedValue({ id: 'v-1', scriptId: 'script-1', elements: [], createdAt: '2024-01-01' }),
      restoreVersion: vi.fn(),
    };
    tier = 'writer';
    manager = new AutosaveManager(mockRepo, () => tier);
  });

  afterEach(() => {
    manager.stop();
    vi.useRealTimers();
  });

  it('local save → cloud sync → version snapshot end-to-end', async () => {
    manager.start('script-1');
    const elements = [makeElement({ text: 'Draft content' })];
    manager.onContentChange(elements);

    // Layer 1: debounce fires at 1500ms
    vi.advanceTimersByTime(1500);
    expect(storageMock._store['draftkit:draft:script-1']).toBeDefined();

    // Layer 2: cloud sync at 45s
    await vi.advanceTimersByTimeAsync(45_000);
    expect(mockRepo.updateScript).toHaveBeenCalledWith('script-1', { elements });

    // Layer 3: version snapshot at 10min
    await vi.advanceTimersByTimeAsync(600_000 - 45_000);
    expect(mockRepo.createVersion).toHaveBeenCalledWith('script-1', elements);
  });

  it('conflict resolution picks newer version', async () => {
    const cloudScript = makeScript({
      updatedAt: '2024-06-01T00:00:00Z',
      elements: [makeElement({ text: 'cloud' })],
    });
    (mockRepo.getScript as ReturnType<typeof vi.fn>).mockResolvedValue(cloudScript);

    // Local draft is older
    const cloudTime = new Date('2024-06-01T00:00:00Z').getTime();
    storageMock._store['draftkit:draft:script-1'] = JSON.stringify({
      elements: [makeElement({ text: 'local-old' })],
      timestamp: cloudTime - 5000,
    });

    const resolved = await manager.resolveConflict('script-1');
    expect(resolved[0].text).toBe('cloud');
  });

  it('skips cloud sync for free tier', async () => {
    tier = 'free';
    manager.start('script-1');
    manager.onContentChange([makeElement()]);
    vi.advanceTimersByTime(1500);

    await vi.advanceTimersByTimeAsync(45_000);
    expect(mockRepo.updateScript).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. BlueprintRepository session and answer persistence
// ═══════════════════════════════════════════════════════════════════════════

describe('Integration: BlueprintRepository session + answer flow', () => {
  let repo: BlueprintRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    queryMock = createQueryMock();
    repo = new BlueprintRepository();
  });

  it('create session → save answer → retrieve answers', async () => {
    // Create session
    const sessionRow = {
      id: 'session-1',
      user_id: 'user-1',
      framework_id: 'fw-1',
      genre: 'Drama',
      format: 'feature',
      tone: 'Dark',
      status: 'in_progress',
      created_at: '2024-01-01T00:00:00Z',
      completed_at: null,
    };
    queryMock.single.mockResolvedValueOnce({ data: sessionRow, error: null });

    const session = await repo.createOutlineSession({
      userId: 'user-1',
      frameworkId: 'fw-1',
      genre: 'Drama',
      format: 'feature',
      tone: 'Dark',
      status: 'in_progress',
      createdAt: '2024-01-01T00:00:00Z',
      completedAt: null,
    });
    expect(session.id).toBe('session-1');
    expect(session.genre).toBe('Drama');

    // Save answer
    queryMock = createQueryMock();
    queryMock.single.mockResolvedValueOnce({ data: null, error: null });
    await repo.saveOutlineAnswer({
      sessionId: 'session-1',
      beatId: 'beat-1',
      answerText: 'The protagonist is a detective.',
      createdAt: '2024-01-01T00:01:00Z',
      updatedAt: '2024-01-01T00:01:00Z',
    });
    expect(queryMock.upsert).toHaveBeenCalled();

    // Retrieve answers
    queryMock = createQueryMock();
    const answerRow = {
      id: 'ans-1',
      session_id: 'session-1',
      beat_id: 'beat-1',
      answer_text: 'The protagonist is a detective.',
      created_at: '2024-01-01T00:01:00Z',
      updated_at: '2024-01-01T00:01:00Z',
    };
    queryMock.single.mockResolvedValueOnce({ data: [answerRow], error: null });

    const answers = await repo.getOutlineAnswers('session-1');
    expect(answers).toHaveLength(1);
    expect(answers[0].answerText).toBe('The protagonist is a detective.');
  });

  it('retrieve session by id', async () => {
    queryMock.single.mockResolvedValueOnce({
      data: {
        id: 'session-1',
        user_id: 'user-1',
        framework_id: 'fw-1',
        genre: 'Comedy',
        format: 'short',
        tone: 'Light',
        status: 'completed',
        created_at: '2024-01-01T00:00:00Z',
        completed_at: '2024-01-01T01:00:00Z',
      },
      error: null,
    });

    const session = await repo.getOutlineSession('session-1');
    expect(session.status).toBe('completed');
    expect(session.genre).toBe('Comedy');
  });

  it('propagates errors as AppError', async () => {
    queryMock.single.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });
    await expect(repo.getFrameworks()).rejects.toThrow(AppError);
  });
});
