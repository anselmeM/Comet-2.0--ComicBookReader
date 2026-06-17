import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  cacheLimitGB: number;
  setCacheLimitGB: (limit: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      cacheLimitGB: 2.0,
      setCacheLimitGB: (cacheLimitGB) => set({ cacheLimitGB }),
    }),
    {
      name: 'comet-settings-storage',
    },
  ),
);
