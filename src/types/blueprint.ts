export interface Framework {
  id: string;
  name: string;
  description: string;
  beatCount: number;
  sortOrder: number;
  isDefault: boolean;
}

export interface Beat {
  id: string;
  frameworkId: string;
  name: string;
  description: string;
  beatOrder: number;
  pageRangeStart: number | null;
  pageRangeEnd: number | null;
}

export interface BeatPrompt {
  id: string;
  frameworkId: string;
  beatId: string;
  genre: string | null;
  storyType: string | null;
  promptText: string;
  sortOrder: number;
}

export interface BeatExample {
  id: string;
  frameworkId: string;
  beatId: string;
  genre: string | null;
  exampleText: string;
  sourceTitle: string | null;
  sortOrder: number;
}

export interface OutlineSession {
  id: string;
  userId: string;
  frameworkId: string;
  genre: string;
  format: string;
  tone: string;
  status: 'in_progress' | 'completed';
  createdAt: string;
  completedAt: string | null;
}

export interface OutlineAnswer {
  id: string;
  sessionId: string;
  beatId: string;
  answerText: string;
  createdAt: string;
  updatedAt: string;
}
