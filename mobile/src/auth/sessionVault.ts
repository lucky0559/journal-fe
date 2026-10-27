import type { KeyValueStore } from '@/data/pinVault';
import type { AuthUser } from './types';

const KEY = 'journal.session.v2';

export interface Session { user: AuthUser; token: string }

export interface SessionVault {
  save(user: AuthUser, token: string): Promise<void>;
  load(): Promise<Session | null>;
  clear(): Promise<void>;
}

const isUser = (v: unknown): v is AuthUser => {
  const u = v as Partial<AuthUser> | null;
  return !!u && typeof u.id === 'string' && typeof u.email === 'string' && typeof u.name === 'string' && typeof u.givenName === 'string';
};

/**
 * Persists the profile and the app’s own session token (issued by our backend) in secure storage.
 * The Google ID token is never stored; only whitelisted profile fields are written.
 */
export function createSessionVault(store: KeyValueStore): SessionVault {
  return {
    async save(u, token) {
      const { id, email, name, givenName, photo } = u;
      await store.set(KEY, JSON.stringify({ user: { id, email, name, givenName, photo: photo ?? null }, token }));
    },
    async load() {
      try {
        const raw = await store.get(KEY);
        const parsed = raw ? (JSON.parse(raw) as { user?: unknown; token?: unknown }) : null;
        if (!parsed || !isUser(parsed.user) || typeof parsed.token !== 'string' || !parsed.token) return null;
        return { user: { ...parsed.user, photo: parsed.user.photo ?? null }, token: parsed.token };
      } catch {
        return null;
      }
    },
    clear: () => store.del(KEY),
  };
}
