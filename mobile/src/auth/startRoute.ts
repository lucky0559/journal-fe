export type StartRoute = '/login' | '/onboarding' | '/(tabs)';

/** Where the app should land after launch. `null` = session still loading. */
export function startRoute(s: { authStatus: 'unknown' | 'signedOut' | 'signedIn'; onboarded: boolean }): StartRoute | null {
  if (s.authStatus === 'unknown') return null;
  if (s.authStatus === 'signedOut') return '/login';
  return s.onboarded ? '/(tabs)' : '/onboarding';
}
