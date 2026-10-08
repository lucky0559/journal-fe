/** @jest-environment node */
import { DEFAULT_SETTINGS, type SettingsRepo } from '@/data/settingsRepo';
import { createSettingsStore } from './settingsStore';

it('loads, then updates optimistically and persists', async () => {
  let stored = { ...DEFAULT_SETTINGS, name: 'Maya' };
  const repo: SettingsRepo = { load: async () => stored, save: async (p) => { stored = { ...stored, ...p }; } };
  const useStore = createSettingsStore(() => repo);
  await useStore.getState().load();
  expect(useStore.getState().settings.name).toBe('Maya');
  const p = useStore.getState().update({ remindTime: '10:00 pm' });
  expect(useStore.getState().settings.remindTime).toBe('10:00 pm');
  await p;
  expect(stored.remindTime).toBe('10:00 pm');
});
