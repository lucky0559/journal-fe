import type { KeyValueStore } from '@/data/pinVault';
import type { AuthUser } from './types';

const KEY = 'journal.session.v1';

export interface SessionVault {
  save(user: AuthUser): Promise<void>;
  load(): Promise<AuthUser | null>;
  clear(): Promise<void>;
}

const isUser = (v: unknown): v is AuthUser => {
  const u = v as Partial<AuthUser> | null;
  return !!u && typeof u.id === 'string' && typeof u.email === 'string' && typeof u.name === 'string' && typeof u.givenName === 'string';
};

/** Persists the profile only. The ID token stays in memory; it is never written to disk. */
export function createSessionVault(store: KeyValueStore): SessionVault {
  return {
    async save(u) {
      const { id, email, name, givenName, photo } = u;
      await store.set(KEY, JSON.stringify({ id, email, name, givenName, photo: photo ?? null }));
    },
    async load() {
      try {
        const raw = await store.get(KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        return isUser(parsed) ? { ...parsed, photo: parsed.photo ?? null } : null;
      } catch {
        return null;
      }
    },
    clear: () => store.del(KEY),
  };
}
