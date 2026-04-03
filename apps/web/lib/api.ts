import { API_BASE, getApiBaseFallbackMessage, hasApiBase } from './env';
import { joinApiUrl } from './url';

const rawApiBase = process.env.NEXT_PUBLIC_API_BASE ?? process.env.API_BASE ?? '';

export const API_BASE = rawApiBase.replace(/\/+$/, '');

export function getHealthEndpoint(): string | null {
  if (!API_BASE) {
    return null;
  }

  return joinUrl(API_BASE, '/health');
}

export class ApiError extends Error {
  status: number;
  payload: unknown;

export function getHealthEndpoint(): string {
  return joinUrl(API_BASE, '/health');
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

  const targetUrl = API_BASE ? joinUrl(API_BASE, path) : path;
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
