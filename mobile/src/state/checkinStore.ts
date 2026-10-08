import { create } from 'zustand';

interface CheckinState {
  mood: number;
  feelings: string[];
  setMood(v: number): void;
  toggleFeeling(name: string): void;
}

export const useCheckin = create<CheckinState>()((set) => ({
  mood: 62,
  feelings: [],
  setMood: (mood) => set({ mood }),
  toggleFeeling: (name) =>
    set((s) => ({ feelings: s.feelings.includes(name) ? s.feelings.filter((f) => f !== name) : [...s.feelings, name] })),
}));
