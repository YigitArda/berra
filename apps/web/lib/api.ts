import { joinUrl } from './url';

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
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
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

  return (await res.json()) as T;
}
