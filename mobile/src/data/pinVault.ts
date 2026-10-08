export interface KeyValueStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
}

export interface PinVault {
  save(pin: string): Promise<void>;
  verify(pin: string): Promise<boolean>;
  clear(): Promise<void>;
  has(): Promise<boolean>;
}

const KEY = 'journal.pin.v1';
const isPin = (p: string) => /^\d{4}$/.test(p);

export function createPinVault(deps: {
  store: KeyValueStore;
  digest(input: string): Promise<string>;
  randomSalt(): Promise<string>;
}): PinVault {
  return {
    async save(pin) {
      if (!isPin(pin)) throw new Error('PIN must be exactly four digits');
      const salt = await deps.randomSalt();
      await deps.store.set(KEY, `${salt}:${await deps.digest(salt + pin)}`);
    },
    async verify(pin) {
      if (!isPin(pin)) return false;
      const stored = await deps.store.get(KEY);
      if (!stored) return false;
      const i = stored.indexOf(':');
      return stored.slice(i + 1) === (await deps.digest(stored.slice(0, i) + pin));
    },
    clear: () => deps.store.del(KEY),
    async has() {
      return (await deps.store.get(KEY)) !== null;
    },
  };
}
