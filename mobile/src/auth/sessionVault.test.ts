/** @jest-environment node */
import type { KeyValueStore } from '@/data/pinVault';
import { createSessionVault } from './sessionVault';

const user = { id: 'g1', email: 'maya@example.com', name: 'Maya Cruz', givenName: 'Maya', photo: null };

function setup() {
  const mem = new Map<string, string>();
  const store: KeyValueStore = {
    get: async (k) => mem.get(k) ?? null,
    set: async (k, v) => { mem.set(k, v); },
    del: async (k) => { mem.delete(k); },
  };
  return { vault: createSessionVault(store), mem };
}

it('round-trips the signed-in user', async () => {
  const { vault } = setup();
  expect(await vault.load()).toBeNull();
  await vault.save(user);
  expect(await vault.load()).toEqual(user);
});

it('forgets the user on clear', async () => {
  const { vault } = setup();
  await vault.save(user);
  await vault.clear();
  expect(await vault.load()).toBeNull();
});

it('treats corrupt or incomplete data as signed out', async () => {
  const { vault, mem } = setup();
  mem.set('journal.session.v1', '{oops');
  expect(await vault.load()).toBeNull();
  mem.set('journal.session.v1', JSON.stringify({ id: 'x' }));
  expect(await vault.load()).toBeNull();
});

it('never stores an id token', async () => {
  const { vault, mem } = setup();
  await vault.save({ ...user, idToken: 'secret' } as never);
  expect([...mem.values()].join('')).not.toContain('secret');
});
