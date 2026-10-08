import { create } from 'zustand';

interface LockState {
  locked: boolean;
  suspended: number;
  lock(): void;
  unlock(): void;
  withoutRelock<T>(fn: () => Promise<T>): Promise<T>;
}

export const useLock = create<LockState>()((set) => ({
  locked: false,
  suspended: 0,
  lock: () => set({ locked: true }),
  unlock: () => set({ locked: false }),
  async withoutRelock(fn) {
    set((s) => ({ suspended: s.suspended + 1 }));
    try {
      return await fn();
    } finally {
      // The OS can report "background" a beat after the system dialog closes, so hold the guard briefly.
      setTimeout(() => set((s) => ({ suspended: Math.max(0, s.suspended - 1) })), 1000);
    }
  },
}));
