import type { AuthUser } from './types';

/**
 * Boundary for the future backend: trade a Google ID token for an app session.
 * `localAuthGateway` (no server) echoes the token; the real one is `createApiAuthGateway`.
 */
export interface AuthGateway {
  exchange(idToken: string, user: AuthUser): Promise<{ token: string; user?: AuthUser }>;
}

export const localAuthGateway: AuthGateway = {
  exchange: async (idToken) => ({ token: idToken }),
};
