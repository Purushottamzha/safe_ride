import { create } from 'zustand';

interface OfflineState {
  isOnline: boolean;
  pendingCount: number;
  setOnline: (online: boolean) => void;
  incrementPending: () => void;
  decrementPending: () => void;
  clearPending: () => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
  isOnline: true,
  pendingCount: 0,

  setOnline: (online: boolean) => {
    set({ isOnline: online });
  },

  incrementPending: () => {
    set((state) => ({ pendingCount: state.pendingCount + 1 }));
  },

  decrementPending: () => {
    set((state) => ({
      pendingCount: Math.max(0, state.pendingCount - 1),
    }));
  },

  clearPending: () => {
    set({ pendingCount: 0 });
  },
}));
