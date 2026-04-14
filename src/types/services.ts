import type { ScreenplayElement, Script } from './screenplay';
import type { BeatPrompt, BeatExample } from './blueprint';
import type { GatedFeature } from './subscription';

export interface IAutosaveManager {
  start(scriptId: string): void;
  stop(): void;
  onContentChange(elements: ScreenplayElement[]): void;
  getLocalDraft(scriptId: string): { elements: ScreenplayElement[]; timestamp: number } | null;
  resolveConflict(scriptId: string): Promise<ScreenplayElement[]>;
}

export interface IExportManager {
  exportPDF(script: Script): Promise<Blob>;
  exportFDX(script: Script): Promise<string>;
  exportFountain(script: Script): Promise<string>;
  parseFountain(fountain: string): ScreenplayElement[];
  parseFDX(fdx: string): ScreenplayElement[];
}

export interface ISuggestionEngine {
  getPrompts(frameworkId: string, beatId: string, genre: string, storyType: string): Promise<BeatPrompt[]>;
  getExamples(frameworkId: string, beatId: string, genre: string): Promise<BeatExample[]>;
  getFallbackPrompts(frameworkId: string, beatId: string): Promise<BeatPrompt[]>;
}

export interface ITierGateService {
  canCreateScript(userId: string): Promise<boolean>;
  canAccessFeature(userId: string, feature: GatedFeature): Promise<boolean>;
  getScriptCount(userId: string): Promise<number>;
}
