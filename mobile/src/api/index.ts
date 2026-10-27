import { createApiClient } from './client';

/** Address of journ-al-be. Emulator: http://10.0.2.2:3000; USB device: `adb reverse tcp:3000 tcp:3000` + http://localhost:3000. */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

// The auth store needs the client (to sign in) and the client needs the auth store (for the token),
// so the session accessors are bound after the store exists.
let session = { getToken: (): string | null => null, onUnauthorized: (): void => {} };
export function bindSession(s: typeof session): void {
  session = s;
}

export const api = createApiClient({
  baseUrl: API_URL,
  getToken: () => session.getToken(),
  onUnauthorized: () => session.onUnauthorized(),
});
