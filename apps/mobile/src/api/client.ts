import {env} from '@/lib/env';
import {useAuthStore} from '@/stores/authStore';
import {clearTokens, saveTokens} from '@/lib/storage';
import * as mocks from '@/api/mocks';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type MockHandler = (path: string, init: RequestInit) => Promise<unknown> | null;
const mockHandler: MockHandler = mocks.handle;

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  signal?: AbortSignal;
}

async function rawFetch<T>(path: string, opts: FetchOptions): Promise<T> {
  if (env.USE_MOCKS) {
    const result = await mockHandler(path, {
      method: opts.method ?? 'GET',
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
    if (result !== null) return result as T;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers ?? {}),
  };

  if (!opts.skipAuth) {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  }

  const url = `${env.API_URL}${path}`;
  const res = await fetch(url, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? (safeJson(text) as unknown) : undefined;

  if (!res.ok) {
    const errObj = (data ?? {}) as {message?: string; code?: string; details?: unknown};
    throw new ApiError(
      res.status,
      errObj.message ?? `Request failed with ${res.status}`,
      errObj.code,
      errObj.details,
    );
  }

  return data as T;
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return undefined;
  }
}

let refreshInFlight: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) return false;
    try {
      const data = await rawFetch<{accessToken: string; refreshToken: string}>(
        '/auth/refresh',
        {method: 'POST', body: {refreshToken}, skipAuth: true},
      );
      await saveTokens(data);
      useAuthStore.getState().setTokens(data);
      return true;
    } catch {
      await clearTokens();
      useAuthStore.getState().logout();
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  try {
    return await rawFetch<T>(path, opts);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && !opts.skipAuth) {
      const refreshed = await attemptRefresh();
      if (refreshed) return rawFetch<T>(path, opts);
    }
    throw err;
  }
}
