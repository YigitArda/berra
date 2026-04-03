import { joinUrl } from './url';

const DEFAULT_API_BASE = 'http://localhost:4000/api';

function normalizeBaseUrl(value?: string): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getApiBase(): string {
  return normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE) ?? DEFAULT_API_BASE;
}

export function getServerApiBase(): string | null {
  return normalizeBaseUrl(process.env.API_BASE) ?? normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE);
}

export function getHealthEndpoint(): string | null {
  const apiBase = getServerApiBase();
  return apiBase ? joinUrl(apiBase, '/health') : null;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(joinUrl(getApiBase(), path), {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
    throw new Error(payload.error ?? payload.message ?? `HTTP ${res.status}`);
  }

  return (await res.json()) as T;
}
