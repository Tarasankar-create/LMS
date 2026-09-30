import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_SETTINGS, type LibrarySettings } from '@/types';

interface SettingsState {
  settings: LibrarySettings;
  updateSettings: (partial: Partial<LibrarySettings>) => void;
  resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      updateSettings: (partial) =>
        set((state) => ({ settings: { ...state.settings, ...partial } })),
      resetToDefaults: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    { name: 'psc-lms-settings' },
  ),
);
