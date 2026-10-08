import { reconcileLock } from './reconcileLock';

it('keeps the lock when a PIN exists', async () => {
  expect(await reconcileLock(true, { has: async () => true })).toBe(true);
});
it('drops the lock flag when the PIN is gone (e.g. restored backup) so the user is not locked out', async () => {
  expect(await reconcileLock(true, { has: async () => false })).toBe(false);
});
it('stays off when it was off', async () => {
  expect(await reconcileLock(false, { has: async () => true })).toBe(false);
});
it('keeps the lock if secure storage cannot be read', async () => {
  expect(await reconcileLock(true, { has: async () => { throw new Error('keystore'); } })).toBe(true);
});
