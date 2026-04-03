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

const toSnippet = (value: string, maxLength = 200): string => {
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength)}…`;
};

const isJsonResponse = (res: Response): boolean =>
  (res.headers.get('content-type') ?? '').toLowerCase().includes('application/json');

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    if (isJsonResponse(res)) {
      const payload = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
      if (payload?.error || payload?.message) {
        throw new Error(payload.error ?? payload.message);
      }
    }

    const bodyText = await res.text().catch(() => '');
    const snippet = toSnippet(bodyText);
    throw new Error(snippet ? `HTTP ${res.status}: ${snippet}` : `HTTP ${res.status}`);
  }

  if (res.status === 204) {
    return null;
  }

  if (isJsonResponse(res)) {
    return (await res.json()) as T;
  }

  return (await res.text()) as T;
}
