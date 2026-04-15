// === Production Tools Types ===

export type ShotType =
  | 'wide'
  | 'medium'
  | 'close-up'
  | 'extreme-close-up'
  | 'over-the-shoulder'
  | 'pov'
  | 'insert'
  | 'establishing'
  | 'two-shot'
  | 'aerial';

export type FeatureKey =
  | 'shot_lists'
  | 'agreements'
  | 'lighting_diagrams'
  | 'mood_boards'
  | 'stripe_payments';

export type LightingSymbolType =
  | 'key_light'
  | 'fill_light'
  | 'back_light'
  | 'hair_light'
  | 'bounce'
  | 'flag'
  | 'diffusion'
  | 'gel'
  | 'practical';

export type DiagramElementType =
  | 'lighting_symbol'
  | 'camera'
  | 'actor'
  | 'wall'
  | 'window'
  | 'door';

// === Data Interfaces ===

export interface ShotList {
  id: string;
  userId: string;
  scriptId: string | null;
  sceneHeading: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShotEntry {
  id: string;
  shotListId: string;
  shotNumber: number;
  shotType: ShotType;
  description: string;
  cameraAngle: string;
  cameraMovement: string;
  lens: string;
  notes: string;
  cameraDesignation: string;
  referenceImagePath: string | null;
  shotOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateField {
  key: string;
  label: string;
  type: 'text' | 'date' | 'textarea';
  required: boolean;
}

export interface AgreementTemplate {
  id: string;
  userId: string | null;
  templateType: 'model_release' | 'location_release' | 'crew_deal_memo' | 'custom';
  name: string;
  fields: TemplateField[];
  storagePath: string | null;
  createdAt: string;
}

export interface AgreementInstance {
  id: string;
  userId: string;
  templateId: string;
  fieldValues: Record<string, string>;
  signaturePath: string | null;
  status: 'draft' | 'signed';
  createdAt: string;
  updatedAt: string;
}

export interface DiagramElement {
  id: string;
  type: DiagramElementType;
  symbolType?: LightingSymbolType;
  x: number;
  y: number;
  rotation: number;
  label: string;
  width?: number;
  height?: number;
}

export interface LightingDiagram {
  id: string;
  userId: string;
  scriptId: string;
  sceneIndex: number;
  sceneHeading: string;
  elements: DiagramElement[];
  canvasWidth: number;
  canvasHeight: number;
  createdAt: string;
  updatedAt: string;
}

export interface MoodBoard {
  id: string;
  userId: string;
  scriptId: string | null;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface MoodBoardImage {
  id: string;
  moodBoardId: string;
  tmdbImagePath: string;
  tmdbMovieId: number;
  note: string;
  tags: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlag {
  id: string;
  featureKey: FeatureKey;
  featureLabel: string;
  isEnabled: boolean;
  updatedAt: string;
}

export interface MovieSearchResult {
  id: number;
  title: string;
  releaseDate: string;
  posterPath: string | null;
  genreIds: number[];
}

export interface TMDBImage {
  filePath: string;
  width: number;
  height: number;
  type: 'backdrop' | 'still' | 'poster';
}

export interface AdminUserRow {
  id: string;
  email: string;
  displayName: string | null;
  tier: string;
  scriptCount: number;
  createdAt: string;
  lockedAt: string | null;
}

// === Repository Interfaces ===

export interface IShotListRepository {
  getShotLists(userId: string, scriptId?: string): Promise<ShotList[]>;
  createShotList(list: Omit<ShotList, 'id' | 'createdAt' | 'updatedAt'>): Promise<ShotList>;
  deleteShotList(listId: string): Promise<void>;
  getShotEntries(shotListId: string): Promise<ShotEntry[]>;
  insertShotEntry(entry: Omit<ShotEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<ShotEntry>;
  updateShotEntry(entryId: string, updates: Partial<ShotEntry>): Promise<void>;
  deleteShotEntry(entryId: string): Promise<void>;
  reorderShotEntries(shotListId: string, orderedIds: string[]): Promise<void>;
}

export interface IAgreementRepository {
  getTemplates(userId: string): Promise<AgreementTemplate[]>;
  createTemplate(template: Omit<AgreementTemplate, 'id' | 'createdAt'>): Promise<AgreementTemplate>;
  getInstances(userId: string): Promise<AgreementInstance[]>;
  getInstance(instanceId: string): Promise<AgreementInstance>;
  createInstance(instance: Omit<AgreementInstance, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgreementInstance>;
  updateInstance(instanceId: string, updates: Partial<AgreementInstance>): Promise<void>;
}

export interface ILightingDiagramRepository {
  getDiagram(scriptId: string, sceneIndex: number): Promise<LightingDiagram | null>;
  saveDiagram(diagram: Omit<LightingDiagram, 'id' | 'createdAt' | 'updatedAt'>): Promise<LightingDiagram>;
  updateDiagram(diagramId: string, elements: DiagramElement[]): Promise<void>;
}

export interface IMoodBoardRepository {
  getBoards(userId: string, scriptId?: string): Promise<MoodBoard[]>;
  createBoard(board: Omit<MoodBoard, 'id' | 'createdAt' | 'updatedAt'>): Promise<MoodBoard>;
  deleteBoard(boardId: string): Promise<void>;
  getImages(boardId: string): Promise<MoodBoardImage[]>;
  saveImage(image: Omit<MoodBoardImage, 'id' | 'createdAt' | 'updatedAt'>): Promise<MoodBoardImage>;
  updateImage(imageId: string, updates: Partial<MoodBoardImage>): Promise<void>;
  deleteImage(imageId: string): Promise<void>;
}

export interface IFeatureFlagRepository {
  getAllFlags(): Promise<FeatureFlag[]>;
  updateFlag(flagId: string, isEnabled: boolean): Promise<void>;
}

export interface IAdminRepository {
  getTotalUsers(): Promise<number>;
  getTotalScripts(): Promise<number>;
  getActiveUsersLast7Days(): Promise<number>;
  getUsers(page: number, pageSize: number): Promise<{ users: AdminUserRow[]; total: number }>;
  lockUser(userId: string): Promise<void>;
  unlockUser(userId: string): Promise<void>;
}

// === Service Interfaces ===

export interface ITMDBService {
  searchMovies(query: string, options?: { genre?: number; yearStart?: number; yearEnd?: number }): Promise<MovieSearchResult[]>;
  getMovieImages(movieId: number): Promise<TMDBImage[]>;
  getImageUrl(path: string, size?: 'w200' | 'w500' | 'original'): string;
}

export interface IFeatureGateService {
  initialize(): Promise<void>;
  isFeatureEnabled(featureKey: FeatureKey): boolean;
}

export interface IFileUploadService {
  uploadFile(bucket: string, path: string, file: File): Promise<string>;
  validateFileType(file: File, allowedTypes: string[]): boolean;
  validateFileSize(file: File, maxSizeMB: number): boolean;
  getPublicUrl(bucket: string, path: string): string;
}

export interface ILightingSerializer {
  serialize(elements: DiagramElement[], canvasWidth: number, canvasHeight: number): string;
  deserialize(json: string): { elements: DiagramElement[]; canvasWidth: number; canvasHeight: number };
}

export interface IReadTimeCalculator {
  calculate(htmlContent: string): number;
}
