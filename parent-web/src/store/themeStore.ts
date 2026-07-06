import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  mode: 'light';
  setMode: (mode: 'light') => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'light',
      setMode: () => set({ mode: 'light' }),
    }),
    { name: 'saferide-theme' },
  ),
);
