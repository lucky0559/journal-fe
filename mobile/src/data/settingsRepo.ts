import type { Settings } from '@/domain/types';
import type { Db } from './db';

export const DEFAULT_SETTINGS: Settings = { name: '', remind: true, remindTime: '9:00 pm', lockOn: false, onboarded: false, syncOwner: '' };

export interface SettingsRepo {
  load(): Promise<Settings>;
  save(patch: Partial<Settings>): Promise<void>;
}

export function createSettingsRepo(db: Db): SettingsRepo {
  return {
    async load() {
      const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
      const out: Record<string, unknown> = { ...DEFAULT_SETTINGS };
      for (const { key, value } of rows) {
        if (!(key in DEFAULT_SETTINGS)) continue;
        try {
          const v = JSON.parse(value);
          if (typeof v === typeof (DEFAULT_SETTINGS as unknown as Record<string, unknown>)[key]) out[key] = v;
        } catch {
          /* keep default */
        }
      }
      return out as unknown as Settings;
    },
    async save(patch) {
      for (const [k, v] of Object.entries(patch)) {
        await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', k, JSON.stringify(v));
      }
    },
  };
}
