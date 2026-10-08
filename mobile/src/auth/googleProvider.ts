import type { AuthProvider, SignInResult } from './types';

interface SdkUser { id: string; email: string; name: string | null; givenName: string | null; photo: string | null }

/** The slice of @react-native-google-signin/google-signin we use, so it can be faked in tests. */
export interface GoogleSdk {
  configure(options: { webClientId: string }): void;
  hasPlayServices(): Promise<boolean>;
  signIn(): Promise<
    | { type: 'success'; data: { idToken: string | null; user: SdkUser } }
    | { type: 'cancelled'; data: null }
  >;
  signOut(): Promise<unknown>;
  statusCodes: { SIGN_IN_CANCELLED: string; PLAY_SERVICES_NOT_AVAILABLE: string; IN_PROGRESS: string };
}

export function createGoogleProvider(sdk: GoogleSdk, webClientId: string): AuthProvider {
  let configured = false;

  const fail = (e: unknown): SignInResult => {
    const code = typeof e === 'object' && e !== null && 'code' in e ? String((e as { code: unknown }).code) : '';
    if (code === sdk.statusCodes.SIGN_IN_CANCELLED) return { ok: false, reason: 'cancelled' };
    if (code === sdk.statusCodes.PLAY_SERVICES_NOT_AVAILABLE) return { ok: false, reason: 'unavailable' };
    if (code === sdk.statusCodes.IN_PROGRESS) return { ok: false, reason: 'busy' };
    return { ok: false, reason: 'error' };
  };

  return {
    async signIn() {
      if (!webClientId) return { ok: false, reason: 'misconfigured' };
      try {
        if (!configured) {
          sdk.configure({ webClientId });
          configured = true;
        }
        await sdk.hasPlayServices();
        const res = await sdk.signIn();
        if (res.type !== 'success') return { ok: false, reason: 'cancelled' };
        const { idToken, user } = res.data;
        if (!idToken) return { ok: false, reason: 'error' };
        const name = user.name ?? user.email;
        return {
          ok: true,
          idToken,
          user: { id: user.id, email: user.email, name, givenName: user.givenName ?? name.split(/\s+/)[0], photo: user.photo ?? null },
        };
      } catch (e) {
        return fail(e);
      }
    },
    async signOut() {
      try {
        await sdk.signOut();
      } catch {
        // Signing out locally must never be blocked by Google being unreachable.
      }
    },
  };
}
