/** @jest-environment node */
import { ApiError, createApiClient } from './client';

type FetchArgs = [string, RequestInit];
function fakeFetch(responses: { status: number; body?: unknown }[]) {
  const calls: FetchArgs[] = [];
  const impl = jest.fn(async (url: string, init: RequestInit) => {
    calls.push([url, init]);
    const r = responses.shift() ?? { status: 200, body: {} };
    return {
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      text: async () => (r.body === undefined ? '' : JSON.stringify(r.body)),
    } as Response;
  });
  return { impl: impl as unknown as typeof fetch, calls };
}

const base = { baseUrl: 'http://api.test/', getToken: () => 'tok', onUnauthorized: jest.fn() };

beforeEach(() => base.onUnauthorized.mockClear());

describe('api client', () => {
  it('sends JSON with the bearer token and joins the url cleanly', async () => {
    const f = fakeFetch([{ status: 200, body: { ok: true } }]);
    const api = createApiClient({ ...base, fetchImpl: f.impl });
    const out = await api.request<{ ok: boolean }>('PUT', '/posts/1', { body: { a: 1 } });
    expect(out).toEqual({ ok: true });
    const [url, init] = f.calls[0];
    expect(url).toBe('http://api.test/posts/1');
    expect(init.method).toBe('PUT');
    expect(init.body).toBe('{"a":1}');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer tok', 'Content-Type': 'application/json' });
  });

  it('encodes the query string and skips undefined values', async () => {
    const f = fakeFetch([{ status: 200, body: {} }]);
    await createApiClient({ ...base, fetchImpl: f.impl }).request('GET', '/feed', { query: { tab: 'public', limit: 20, before: undefined, q: 'a b' } });
    expect(f.calls[0][0]).toBe('http://api.test/feed?tab=public&limit=20&q=a%20b');
  });

  it('omits the token when none exists or auth is switched off', async () => {
    const f = fakeFetch([{ status: 200, body: {} }, { status: 200, body: {} }]);
    await createApiClient({ ...base, getToken: () => null, fetchImpl: f.impl }).request('GET', '/x');
    await createApiClient({ ...base, fetchImpl: f.impl }).request('POST', '/auth/google', { body: {}, auth: false });
    expect((f.calls[0][1].headers as Record<string, string>).Authorization).toBeUndefined();
    expect((f.calls[1][1].headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('returns undefined for 204', async () => {
    const f = fakeFetch([{ status: 204 }]);
    expect(await createApiClient({ ...base, fetchImpl: f.impl }).request('DELETE', '/posts/1')).toBeUndefined();
  });

  it('throws ApiError with status and body on failure', async () => {
    const f = fakeFetch([{ status: 404, body: { message: 'Not Found' } }]);
    const err = await createApiClient({ ...base, fetchImpl: f.impl }).request<never>('GET', '/posts/1').catch((e: unknown) => e as ApiError);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 404, body: { message: 'Not Found' } });
  });

  it('signs the user out once on 401 when a token was sent', async () => {
    const f = fakeFetch([{ status: 401, body: {} }]);
    await expect(createApiClient({ ...base, fetchImpl: f.impl }).request('GET', '/me')).rejects.toMatchObject({ status: 401 });
    expect(base.onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('does not sign out on a 401 from the sign-in call itself', async () => {
    const f = fakeFetch([{ status: 401, body: {} }]);
    await expect(createApiClient({ ...base, fetchImpl: f.impl }).request('POST', '/auth/google', { body: {}, auth: false })).rejects.toMatchObject({ status: 401 });
    expect(base.onUnauthorized).not.toHaveBeenCalled();
  });

  it('turns network failures into ApiError(0)', async () => {
    const impl = (async () => { throw new TypeError('Network request failed'); }) as unknown as typeof fetch;
    const err = await createApiClient({ ...base, fetchImpl: impl }).request<never>('GET', '/me').catch((e: unknown) => e as ApiError);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(0);
  });

  it('tolerates a non-JSON error body', async () => {
    const impl = (async () => ({ ok: false, status: 502, text: async () => '<html>bad gateway</html>' })) as unknown as typeof fetch;
    const err = await createApiClient({ ...base, fetchImpl: impl }).request<never>('GET', '/me').catch((e: unknown) => e as ApiError);
    expect(err).toMatchObject({ status: 502 });
  });

  it('refuses to call out when no API url is configured', async () => {
    const err = await createApiClient({ ...base, baseUrl: '' }).request<never>('GET', '/me').catch((e: unknown) => e as ApiError);
    expect(err).toMatchObject({ status: 0 });
  });
});
