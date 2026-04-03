import { API_BASE, getApiBaseFallbackMessage, hasApiBase } from './env';
import { joinApiUrl } from './url';

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? process.env.API_BASE ?? 'http://localhost:4000/api';

export function getHealthEndpoint(): string {
  return joinUrl(API_BASE, '/health');
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  const data = payload as {
    code?: unknown;
    message?: unknown;
    error?: unknown;
    status?: unknown;
  };

  return {
    code: typeof data.code === 'string' && data.code.trim().length > 0 ? data.code : fallback.code,
    message:
      typeof data.message === 'string' && data.message.trim().length > 0
        ? data.message
        : typeof data.error === 'string' && data.error.trim().length > 0
          ? data.error
          : fallback.message,
    status: typeof data.status === 'number' ? data.status : status,
  };
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!hasApiBase()) {
    throw new Error(getApiBaseFallbackMessage());
  }

  const headers = new Headers(init?.headers);
  const body = init?.body;
  const isJsonBody =
    body != null && !(body instanceof FormData) && !(body instanceof Blob) && !(body instanceof URLSearchParams);

  if (isJsonBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(joinUrl(API_BASE, path), {
    ...init,
    credentials: 'include',
    headers,
  });

  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
    throw new ApiError(payload.error ?? payload.message ?? `HTTP ${res.status}`, res.status, payload);
  }

  if (res.status === 204) {
    return null as T;
  }

  if (!isJsonResponse(res)) {
    return null as T;
  }

  return (await res.json()) as T;
}
