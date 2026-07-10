import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  mode: 'light' | 'dark';
  setMode: (mode: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'light',
      setMode: (mode) => set({ mode }),
      toggleTheme: () => set({ mode: get().mode === 'light' ? 'dark' : 'light' }),
    }),
    { name: 'saferide-parent-theme' },
  ),
);
