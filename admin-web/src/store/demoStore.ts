import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DemoState {
  enabled: boolean;
  speed: number;
  setEnabled: (enabled: boolean) => void;
  setSpeed: (speed: number) => void;
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set) => ({
      enabled: false,
      speed: 5,
      setEnabled: (enabled) => set({ enabled }),
      setSpeed: (speed) => set({ speed }),
    }),
    {
      name: 'saferide-demo',
    }
  )
);
