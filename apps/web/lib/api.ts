import { joinUrl } from './url';

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const body = init?.body;
  const isJsonBody =
    body != null && !(body instanceof FormData) && !(body instanceof Blob) && !(body instanceof URLSearchParams);

  if (isJsonBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers,
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
