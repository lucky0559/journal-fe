/** @jest-environment node */
import { createApiAuthGateway } from './apiAuthGateway';
import type { ApiClient } from './client';

const googleUser = { id: 'google-sub', email: 'maya@example.com', name: 'Maya Cruz', givenName: 'Maya', photo: null };

it('trades the Google id token for an app token and the server’s user, without sending a bearer', async () => {
  const request = jest.fn(async () => ({
    token: 'jwt',
    user: { id: 'srv-1', email: 'maya@example.com', name: 'Maya Cruz', givenName: 'Maya', photo: 'https://x/p.png', bio: 'hi' },
  }));
  const gw = createApiAuthGateway({ request } as unknown as ApiClient);
  const r = await gw.exchange('google-id-token', googleUser);
  expect(request).toHaveBeenCalledWith('POST', '/auth/google', { body: { idToken: 'google-id-token' }, auth: false });
  expect(r).toEqual({ token: 'jwt', user: { id: 'srv-1', email: 'maya@example.com', name: 'Maya Cruz', givenName: 'Maya', photo: 'https://x/p.png' } });
});

it('lets API errors propagate so the store can show a message', async () => {
  const gw = createApiAuthGateway({ request: jest.fn(async () => { throw new Error('boom'); }) } as unknown as ApiClient);
  await expect(gw.exchange('t', googleUser)).rejects.toThrow('boom');
});
