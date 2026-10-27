import type { AuthGateway } from '@/auth/gateway';
import type { ApiClient } from './client';

interface ServerUser { id: string; email: string; name: string; givenName: string; photo: string | null }

/** Trades the Google ID token for our own session token; the server’s user becomes the app identity. */
export function createApiAuthGateway(api: ApiClient): AuthGateway {
  return {
    async exchange(idToken) {
      const r = await api.request<{ token: string; user: ServerUser }>('POST', '/auth/google', { body: { idToken }, auth: false });
      const { id, email, name, givenName, photo } = r.user;
      return { token: r.token, user: { id, email, name, givenName, photo: photo ?? null } };
    },
  };
}
