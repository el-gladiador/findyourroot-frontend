import { create } from 'zustand';
import { TabType } from './types';

interface AppState {
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  focusedPersonId: string | null;
  setFocusedPersonId: (id: string | null) => void;
  settings: {
    theme: 'light' | 'dark' | 'system';
    animationsEnabled: boolean;
    language: string;
  };
  updateSettings: (settings: Partial<AppState['settings']>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentTab: 'tree',
  setCurrentTab: (tab) => set({ currentTab: tab }),
  focusedPersonId: null,
  setFocusedPersonId: (id) => set({ focusedPersonId: id }),
  settings: {
    theme: 'system',
    animationsEnabled: true,
    language: 'en',
  },
  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),
}));
