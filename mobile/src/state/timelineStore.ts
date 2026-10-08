import { create } from 'zustand';
import { shiftMonth } from '@/lib/calendar';
import { todayIso } from '@/lib/dates';

interface TimelineUi {
  mode: 'cal' | 'list';
  year: number;
  month: number;
  selDay: string;
  setMode(m: 'cal' | 'list'): void;
  select(iso: string): void;
  shift(delta: 1 | -1): void;
  reset(today: string): void;
}

const init = (iso: string) => ({ year: +iso.slice(0, 4), month: +iso.slice(5, 7) - 1, selDay: iso });

export const useTimelineUi = create<TimelineUi>()((set) => ({
  mode: 'cal',
  ...init(todayIso()),
  setMode: (mode) => set({ mode }),
  select: (selDay) => set({ selDay }),
  shift: (delta) => set((s) => shiftMonth(s.year, s.month, delta)),
  reset: (today) => set(init(today)),
}));
