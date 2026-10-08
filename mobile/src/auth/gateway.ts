import type { AuthUser } from './types';

/**
 * Boundary for the future backend: trade a Google ID token for an app session.
 * v1 has no server, so the token is echoed back and only kept in memory.
 */
export interface AuthGateway {
  exchange(idToken: string, user: AuthUser): Promise<{ token: string }>;
}

export const localAuthGateway: AuthGateway = {
  exchange: async (idToken) => ({ token: idToken }),
};
