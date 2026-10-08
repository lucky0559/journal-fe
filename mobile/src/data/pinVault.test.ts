/** @jest-environment node */
import { createPinVault, type KeyValueStore } from './pinVault';

function setup() {
  const mem = new Map<string, string>();
  const store: KeyValueStore = {
    get: async (k) => mem.get(k) ?? null,
    set: async (k, v) => { mem.set(k, v); },
    del: async (k) => { mem.delete(k); },
  };
  let n = 0;
  const vault = createPinVault({ store, digest: async (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7).toString(16), randomSalt: async () => `salt${++n}` });
  return { vault, mem };
}

it('verifies the saved PIN and rejects others', async () => {
  const { vault } = setup();
  await vault.save('1234');
  expect(await vault.verify('1234')).toBe(true);
  expect(await vault.verify('1235')).toBe(false);
});

it('never stores the PIN in plain text', async () => {
  const { vault, mem } = setup();
  await vault.save('4821');
  expect([...mem.values()].join('|')).not.toContain('4821');
});

it('uses a fresh salt for every save', async () => {
  const { vault, mem } = setup();
  await vault.save('1234');
  const first = [...mem.values()][0];
  await vault.save('1234');
  expect([...mem.values()][0]).not.toBe(first);
});

it('reports has() and forgets on clear()', async () => {
  const { vault } = setup();
  expect(await vault.has()).toBe(false);
  expect(await vault.verify('1234')).toBe(false);
  await vault.save('1234');
  expect(await vault.has()).toBe(true);
  await vault.clear();
  expect(await vault.has()).toBe(false);
  expect(await vault.verify('1234')).toBe(false);
});

it('only accepts exactly four digits', async () => {
  const { vault } = setup();
  await expect(vault.save('12a4')).rejects.toThrow();
  await expect(vault.save('123')).rejects.toThrow();
  await vault.save('1234');
  expect(await vault.verify('12a4')).toBe(false);
  expect(await vault.verify('')).toBe(false);
});
