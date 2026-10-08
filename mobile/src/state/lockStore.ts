import { create } from 'zustand';

export const useLock = create<{ locked: boolean; lock(): void; unlock(): void }>()((set) => ({
  locked: false,
  lock: () => set({ locked: true }),
  unlock: () => set({ locked: false }),
}));
