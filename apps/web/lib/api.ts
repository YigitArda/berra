import { API_BASE, getApiBaseFallbackMessage, hasApiBase } from './env';
import { joinApiUrl } from './url';

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export function getHealthEndpoint(): string | null {
  if (!API_BASE) {
    return null;
  }
  return joinApiUrl(API_BASE, '/health');
}

function isJsonResponse(res: Response) {
  return res.headers.get('Content-Type')?.toLowerCase().includes('application/json') ?? false;
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

  const targetUrl = API_BASE ? joinApiUrl(API_BASE, path) : path;
  const res = await fetch(targetUrl, {
    ...init,
    credentials: 'include',
    headers,
  });

  if (!res.ok) {
    const payload = isJsonResponse(res)
      ? ((await res.json().catch(() => ({}))) as { error?: string; message?: string })
      : null;

    throw new ApiError(payload?.error ?? payload?.message ?? `HTTP ${res.status}`, res.status, payload);
  }

  if (res.status === 204) {
    return null as T;
  }

  if (isJsonResponse(res)) {
    return (await res.json()) as T;
  }

  return (await res.text()) as T;
}
