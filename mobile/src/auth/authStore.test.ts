/** @jest-environment node */
import type { AuthProvider, AuthUser } from './types';
import { localAuthGateway } from './gateway';
import { createAuthStore } from './authStore';

const user: AuthUser = { id: 'g1', email: 'maya@example.com', name: 'Maya Cruz', givenName: 'Maya', photo: null };

function setup(over: { provider?: Partial<AuthProvider>; exchange?: jest.Mock; saved?: AuthUser | null } = {}) {
  const provider: AuthProvider = {
    signIn: jest.fn(async () => ({ ok: true as const, idToken: 'tok', user })),
    signOut: jest.fn(async () => {}),
    ...over.provider,
  };
  let saved: AuthUser | null = over.saved ?? null;
  const vault = {
    save: jest.fn(async (u: AuthUser) => { saved = u; }),
    load: jest.fn(async () => saved),
    clear: jest.fn(async () => { saved = null; }),
  };
  const gateway = { exchange: over.exchange ?? jest.fn(async (t: string) => ({ token: `session-${t}` })) };
  const useStore = createAuthStore({ provider, gateway, vault });
  return { useStore, provider, vault, gateway };
}

describe('authStore', () => {
  it('starts unknown and restores a saved user', async () => {
    const { useStore } = setup({ saved: user });
    expect(useStore.getState().status).toBe('unknown');
    await useStore.getState().restore();
    expect(useStore.getState()).toMatchObject({ status: 'signedIn', user });
  });

  it('restores to signed out when nothing is saved', async () => {
    const { useStore } = setup();
    await useStore.getState().restore();
    expect(useStore.getState()).toMatchObject({ status: 'signedOut', user: null });
  });

  it('signs in, exchanges the id token and persists only the user', async () => {
    const { useStore, vault, gateway } = setup();
    await useStore.getState().signIn();
    expect(gateway.exchange).toHaveBeenCalledWith('tok', user);
    expect(vault.save).toHaveBeenCalledWith(user);
    expect(useStore.getState()).toMatchObject({ status: 'signedIn', user, token: 'session-tok', error: '', busy: false });
  });

  it('a cancelled sign-in is silent and leaves the user signed out', async () => {
    const { useStore } = setup({ provider: { signIn: jest.fn(async () => ({ ok: false as const, reason: 'cancelled' as const })) } });
    await useStore.getState().signIn();
    expect(useStore.getState()).toMatchObject({ status: 'signedOut', error: '', busy: false });
  });

  it.each([
    ['unavailable', 'Google Play services are needed to sign in.'],
    ['misconfigured', 'Google sign-in isn’t set up in this build.'],
    ['error', 'Couldn’t sign in. Please try again.'],
    ['busy', ''],
  ] as const)('maps %s to a plain message', async (reason, message) => {
    const { useStore } = setup({ provider: { signIn: jest.fn(async () => ({ ok: false as const, reason })) } });
    await useStore.getState().signIn();
    expect(useStore.getState().error).toBe(message);
    expect(useStore.getState().status).not.toBe('signedIn');
  });

  it('ignores a second tap while signing in', async () => {
    let release: (v: unknown) => void = () => {};
    const signIn = jest.fn(() => new Promise((res) => { release = res; })) as never;
    const { useStore } = setup({ provider: { signIn } });
    const first = useStore.getState().signIn();
    await useStore.getState().signIn();
    expect(signIn).toHaveBeenCalledTimes(1);
    expect(useStore.getState().busy).toBe(true);
    release({ ok: false, reason: 'cancelled' });
    await first;
    expect(useStore.getState().busy).toBe(false);
  });

  it('does not sign in when the backend exchange fails, and signs out of Google', async () => {
    const { useStore, provider, vault } = setup({ exchange: jest.fn(async () => { throw new Error('500'); }) });
    await useStore.getState().signIn();
    expect(useStore.getState()).toMatchObject({ status: 'signedOut', user: null, error: 'Couldn’t sign in. Please try again.' });
    expect(vault.save).not.toHaveBeenCalled();
    expect(provider.signOut).toHaveBeenCalled();
  });

  it('signs out of Google, forgets the user and clears the token', async () => {
    const { useStore, provider, vault } = setup();
    await useStore.getState().signIn();
    await useStore.getState().signOut();
    expect(provider.signOut).toHaveBeenCalled();
    expect(vault.clear).toHaveBeenCalled();
    expect(useStore.getState()).toMatchObject({ status: 'signedOut', user: null, token: null });
  });
});

describe('localAuthGateway', () => {
  it('echoes the id token until a backend exists', async () => {
    expect(await localAuthGateway.exchange('tok', user)).toEqual({ token: 'tok' });
  });
});
