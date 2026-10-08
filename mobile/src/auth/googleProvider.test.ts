/** @jest-environment node */
import { createGoogleProvider, type GoogleSdk } from './googleProvider';

const CODES = { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED', PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE', IN_PROGRESS: 'IN_PROGRESS' };

function sdk(over: Partial<GoogleSdk> = {}): GoogleSdk {
  return {
    configure: jest.fn(),
    hasPlayServices: jest.fn(async () => true),
    signIn: jest.fn(async () => ({
      type: 'success' as const,
      data: { idToken: 'tok', user: { id: 'g1', email: 'maya@example.com', name: 'Maya Cruz', givenName: 'Maya', photo: 'https://x/p.png' } },
    })),
    signOut: jest.fn(async () => null),
    statusCodes: CODES,
    ...over,
  };
}

describe('googleProvider', () => {
  it('configures the SDK once with the web client id', async () => {
    const s = sdk();
    const p = createGoogleProvider(s, 'web-id.apps.googleusercontent.com');
    await p.signIn();
    await p.signIn();
    expect(s.configure).toHaveBeenCalledTimes(1);
    expect(s.configure).toHaveBeenCalledWith({ webClientId: 'web-id.apps.googleusercontent.com' });
  });

  it('returns the token and a normalised user on success', async () => {
    const r = await createGoogleProvider(sdk(), 'web').signIn();
    expect(r).toEqual({
      ok: true, idToken: 'tok',
      user: { id: 'g1', email: 'maya@example.com', name: 'Maya Cruz', givenName: 'Maya', photo: 'https://x/p.png' },
    });
  });

  it('falls back to the first word of the name and a null photo', async () => {
    const s = sdk({
      signIn: jest.fn(async () => ({ type: 'success' as const, data: { idToken: 't', user: { id: 'g', email: 'a@b.c', name: 'Sol Rivera', givenName: null, photo: null } } })),
    });
    const r = await createGoogleProvider(s, 'web').signIn();
    expect(r).toMatchObject({ ok: true, user: { givenName: 'Sol', photo: null } });
  });

  it('treats a missing id token as an error', async () => {
    const s = sdk({
      signIn: jest.fn(async () => ({ type: 'success' as const, data: { idToken: null, user: { id: 'g', email: 'a@b.c', name: 'A', givenName: 'A', photo: null } } })),
    });
    expect(await createGoogleProvider(s, 'web').signIn()).toEqual({ ok: false, reason: 'error' });
  });

  it('reports a cancelled response', async () => {
    const s = sdk({ signIn: jest.fn(async () => ({ type: 'cancelled' as const, data: null })) });
    expect(await createGoogleProvider(s, 'web').signIn()).toEqual({ ok: false, reason: 'cancelled' });
  });

  it('maps native errors by code', async () => {
    const withCode = (code: string) => sdk({ signIn: jest.fn(async () => { throw Object.assign(new Error('x'), { code }); }) });
    expect(await createGoogleProvider(withCode(CODES.SIGN_IN_CANCELLED), 'web').signIn()).toEqual({ ok: false, reason: 'cancelled' });
    expect(await createGoogleProvider(withCode(CODES.PLAY_SERVICES_NOT_AVAILABLE), 'web').signIn()).toEqual({ ok: false, reason: 'unavailable' });
    expect(await createGoogleProvider(withCode(CODES.IN_PROGRESS), 'web').signIn()).toEqual({ ok: false, reason: 'busy' });
    expect(await createGoogleProvider(withCode('SOMETHING'), 'web').signIn()).toEqual({ ok: false, reason: 'error' });
  });

  it('reports unavailable when Play Services are missing', async () => {
    const s = sdk({ hasPlayServices: jest.fn(async () => { throw Object.assign(new Error('no'), { code: CODES.PLAY_SERVICES_NOT_AVAILABLE }); }) });
    expect(await createGoogleProvider(s, 'web').signIn()).toEqual({ ok: false, reason: 'unavailable' });
  });

  it('refuses to start without a web client id (misconfigured build)', async () => {
    const s = sdk();
    expect(await createGoogleProvider(s, '').signIn()).toEqual({ ok: false, reason: 'misconfigured' });
    expect(s.signIn).not.toHaveBeenCalled();
  });

  it('signs out of Google and never throws', async () => {
    const s = sdk({ signOut: jest.fn(async () => { throw new Error('offline'); }) });
    await expect(createGoogleProvider(s, 'web').signOut()).resolves.toBeUndefined();
    expect(s.signOut).toHaveBeenCalled();
  });
});
