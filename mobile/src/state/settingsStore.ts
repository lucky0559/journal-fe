import { create } from 'zustand';
import type { Settings } from '@/domain/types';
import { DEFAULT_SETTINGS, type SettingsRepo } from '@/data/settingsRepo';

export interface SettingsState {
  settings: Settings;
  loaded: boolean;
  load(): Promise<void>;
  update(patch: Partial<Settings>): Promise<void>;
}

export function createSettingsStore(getRepo: () => SettingsRepo) {
  return create<SettingsState>()((set, get) => ({
    settings: DEFAULT_SETTINGS,
    loaded: false,
    async load() {
      set({ settings: await getRepo().load(), loaded: true });
    },
    async update(patch) {
      set({ settings: { ...get().settings, ...patch } });
      await getRepo().save(patch);
    },
  }));
}
