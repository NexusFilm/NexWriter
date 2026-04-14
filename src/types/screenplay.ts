export type ElementType =
  | 'SCENE_HEADING'
  | 'ACTION'
  | 'CHARACTER'
  | 'DIALOGUE'
  | 'PARENTHETICAL'
  | 'TRANSITION'
  | 'TITLE_PAGE';

export interface ScreenplayElement {
  id: string;
  type: ElementType;
  text: string;
  order: number;
}

export interface Script {
  id: string;
  userId: string;
  title: string;
  elements: ScreenplayElement[];
  pageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScriptVersion {
  id: string;
  scriptId: string;
  elements: ScreenplayElement[];
  createdAt: string;
}
