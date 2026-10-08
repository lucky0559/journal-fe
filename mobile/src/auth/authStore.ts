import { create } from 'zustand';
import type { AuthGateway } from './gateway';
import type { SessionVault } from './sessionVault';
import type { AuthProvider, AuthUser, SignInFailure } from './types';

const MESSAGES: Record<Exclude<SignInFailure, 'cancelled'>, string> = {
  unavailable: 'Google Play services are needed to sign in.',
  misconfigured: 'Google sign-in isn’t set up in this build.',
  error: 'Couldn’t sign in. Please try again.',
  busy: '',
};

export interface AuthState {
  status: 'unknown' | 'signedOut' | 'signedIn';
  user: AuthUser | null;
  token: string | null;
  busy: boolean;
  error: string;
  restore(): Promise<void>;
  signIn(): Promise<void>;
  signOut(): Promise<void>;
}

export function createAuthStore(deps: { provider: AuthProvider; gateway: AuthGateway; vault: SessionVault }) {
  return create<AuthState>()((set, get) => ({
    status: 'unknown',
    user: null,
    token: null,
    busy: false,
    error: '',
    async restore() {
      const user = await deps.vault.load();
      set(user ? { status: 'signedIn', user } : { status: 'signedOut', user: null });
    },
    async signIn() {
      if (get().busy) return;
      set({ busy: true, error: '' });
      try {
        const r = await deps.provider.signIn();
        if (!r.ok) {
          set({ busy: false, error: r.reason === 'cancelled' ? '' : MESSAGES[r.reason], status: get().status === 'signedIn' ? 'signedIn' : 'signedOut' });
          return;
        }
        try {
          const { token } = await deps.gateway.exchange(r.idToken, r.user);
          await deps.vault.save(r.user);
          set({ busy: false, status: 'signedIn', user: r.user, token, error: '' });
        } catch {
          await deps.provider.signOut();
          set({ busy: false, status: 'signedOut', user: null, token: null, error: MESSAGES.error });
        }
      } catch {
        set({ busy: false, status: 'signedOut', error: MESSAGES.error });
      }
    },
    async signOut() {
      await deps.provider.signOut();
      await deps.vault.clear();
      set({ status: 'signedOut', user: null, token: null, error: '' });
    },
  }));
}
