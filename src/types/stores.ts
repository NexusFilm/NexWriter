import type { User } from './auth';
import type { Script, ScreenplayElement } from './screenplay';
import type { Tier } from './subscription';
import type { SaveStatus } from './ui';
import type { Framework } from './blueprint';

export interface AuthState {
  user: User | null;
  tier: Tier;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithProvider: (provider: 'google' | 'github') => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshTier: () => Promise<void>;
}

export interface EditorState {
  script: Script | null;
  elements: ScreenplayElement[];
  saveStatus: SaveStatus;
  activePanelTab: 'scenes' | 'characters' | 'beats' | null;
  showBlueprintAnnotations: boolean;
  setElements: (elements: ScreenplayElement[]) => void;
  updateElement: (id: string, updates: Partial<ScreenplayElement>) => void;
  insertElement: (afterId: string, element: ScreenplayElement) => void;
  deleteElement: (id: string) => void;
  cycleElementType: (id: string) => void;
  setSaveStatus: (status: SaveStatus) => void;
}

export interface BlueprintState {
  framework: Framework | null;
  genre: string;
  format: string;
  tone: string;
  currentBeatIndex: number;
  answers: Record<string, string>;
  sessionId: string | null;
  setFramework: (fw: Framework) => void;
  setGenreToneFormat: (genre: string, format: string, tone: string) => void;
  advanceBeat: () => void;
  setAnswer: (beatId: string, answer: string) => void;
}

export interface UIState {
  paywallModalVisible: boolean;
  toastQueue: Toast[];
  sidebarOpen: boolean;
  showPaywallModal: () => void;
  hidePaywallModal: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  toggleSidebar: () => void;
}

export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}
