export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  language?: string;
  content?: string;
  children?: FileNode[];
  description?: string;
}

export type TVScreenMode = 'splash' | 'initial' | 'login' | 'home';

export interface TVFocusState {
  currentScreen: TVScreenMode;
  focusedId: string;
  focusedRowIndex: number;
  focusedColIndex: number;
}

export interface TVCategoryItem {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  iconName?: string;
  imageBg: string;
}

export interface TVCategoryRow {
  id: string;
  title: string;
  items: TVCategoryItem[];
}
