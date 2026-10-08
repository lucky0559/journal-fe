/** @jest-environment node */
import { createTestDb } from './testDb';
import { migrate } from './migrations';
import { createSettingsRepo, DEFAULT_SETTINGS } from './settingsRepo';

describe('settingsRepo', () => {
  async function setup() {
    const db = createTestDb();
    await migrate(db);
    return createSettingsRepo(db);
  }

  it('returns defaults on a fresh database', async () => {
    expect(await (await setup()).load()).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS).toEqual({ name: '', remind: true, remindTime: '9:00 pm', lockOn: false, onboarded: false });
  });

  it('persists partial updates and keeps other keys', async () => {
    const repo = await setup();
    await repo.save({ name: 'Maya', onboarded: true });
    await repo.save({ remind: false });
    expect(await repo.load()).toEqual({ ...DEFAULT_SETTINGS, name: 'Maya', onboarded: true, remind: false });
  });

  it('falls back to the default for a corrupt value', async () => {
    const db = createTestDb();
    await migrate(db);
    await db.runAsync(`INSERT INTO settings (key, value) VALUES ('remind', '{oops')`);
    expect((await createSettingsRepo(db).load()).remind).toBe(true);
  });
});
