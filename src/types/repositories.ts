import type { Script, ScriptVersion, ScreenplayElement } from './screenplay';
import type { User, Session } from './auth';
import type { Framework, Beat, OutlineSession, OutlineAnswer } from './blueprint';
import type { BlogPost } from './blog';
import type { Tier } from './subscription';
import type { SubscriptionStatus } from './subscription';

export interface IScriptRepository {
  getScripts(userId: string): Promise<Script[]>;
  getScript(scriptId: string): Promise<Script>;
  createScript(userId: string, title: string): Promise<Script>;
  updateScript(scriptId: string, updates: Partial<Script>): Promise<void>;
  duplicateScript(scriptId: string): Promise<Script>;
  deleteScript(scriptId: string): Promise<void>;
  getVersions(scriptId: string, limit?: number): Promise<ScriptVersion[]>;
  createVersion(scriptId: string, elements: ScreenplayElement[]): Promise<ScriptVersion>;
  restoreVersion(scriptId: string, versionId: string): Promise<void>;
}

export interface IAuthRepository {
  signUp(email: string, password: string): Promise<User>;
  signIn(email: string, password: string): Promise<User>;
  signInWithProvider(provider: 'google' | 'github'): Promise<void>;
  signOut(): Promise<void>;
  getSession(): Promise<Session | null>;
  onAuthStateChange(callback: (user: User | null) => void): () => void;
}

export interface IBlueprintRepository {
  getFrameworks(): Promise<Framework[]>;
  getFrameworkBeats(frameworkId: string): Promise<Beat[]>;
  createOutlineSession(session: Omit<OutlineSession, 'id'>): Promise<OutlineSession>;
  saveOutlineAnswer(answer: Omit<OutlineAnswer, 'id'>): Promise<void>;
  getOutlineSession(sessionId: string): Promise<OutlineSession>;
  getOutlineAnswers(sessionId: string): Promise<OutlineAnswer[]>;
}

export interface IBlogRepository {
  getPosts(category?: string): Promise<BlogPost[]>;
  getPost(postId: string): Promise<BlogPost>;
  getCategories(): Promise<string[]>;
}

export interface ISubscriptionRepository {
  getUserTier(userId: string): Promise<Tier>;
  createCheckoutSession(userId: string, tier: 'writer' | 'pro'): Promise<string>;
  getSubscriptionStatus(userId: string): Promise<SubscriptionStatus>;
}
