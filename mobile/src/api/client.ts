export class ApiError extends Error {
  constructor(public status: number, public body: unknown, message?: string) {
    super(message ?? `API error ${status}`);
  }
}

export interface RequestOptions {
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  /** Attach the bearer token (default true). Sign-in itself passes false. */
  auth?: boolean;
}

export interface ApiClient {
  request<T = unknown>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, opts?: RequestOptions): Promise<T>;
}

interface Deps {
  baseUrl: string;
  getToken: () => string | null;
  /** Called when a request that carried a token comes back 401 (expired or deleted account). */
  onUnauthorized: () => void;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export function createApiClient({ baseUrl, getToken, onUnauthorized, fetchImpl, timeoutMs = 15_000 }: Deps): ApiClient {
  const root = baseUrl.replace(/\/+$/, '');

  return {
    async request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
      if (!root) throw new ApiError(0, null, 'The API address isn’t configured in this build.');
      const qs = Object.entries(opts.query ?? {})
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');
      const url = `${root}${path}${qs ? `?${qs}` : ''}`;

      const token = opts.auth === false ? null : getToken();
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
      if (token) headers.Authorization = `Bearer ${token}`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let res: Response;
      try {
        res = await (fetchImpl ?? fetch)(url, {
          method, headers, signal: controller.signal,
          body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
        });
      } catch {
        throw new ApiError(0, null, 'Couldn’t reach the server.');
      } finally {
        clearTimeout(timer);
      }

      const text = await res.text();
      let body: unknown;
      try {
        body = text ? JSON.parse(text) : undefined;
      } catch {
        body = text;
      }
      if (!res.ok) {
        if (res.status === 401 && token) onUnauthorized();
        throw new ApiError(res.status, body);
      }
      return body as T;
    },
  };
}
