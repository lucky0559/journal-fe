export interface AuthUser {
  id: string;
  email: string;
  name: string;
  givenName: string;
  photo: string | null;
}

export type SignInFailure = 'cancelled' | 'unavailable' | 'misconfigured' | 'busy' | 'error';
export type SignInResult = { ok: true; idToken: string; user: AuthUser } | { ok: false; reason: SignInFailure };

export interface AuthProvider {
  signIn(): Promise<SignInResult>;
  signOut(): Promise<void>;
}
