import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, API_BASE, apiFetch } from '../api';

describe('apiFetch', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns parsed JSON response for JSON payloads', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(apiFetch<{ ok: boolean }>('/health')).resolves.toEqual({ ok: true });

    expect(fetchSpy).toHaveBeenCalledWith(`${API_BASE}/health`, {
      credentials: 'include',
      headers: new Headers(),
    });
  });

  it('returns plain text for non-JSON successful responses', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response('pong', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      }),
    );

    await expect(apiFetch<string>('/health')).resolves.toBe('pong');
  });

  it('returns null for 204 responses', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

    await expect(apiFetch<null>('/health')).resolves.toBeNull();
  });

  it('throws ApiError with fallback status message for non-JSON error payloads', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response('server down', { status: 502 }));

    await expect(apiFetch('/health')).rejects.toMatchObject<ApiError>({
      name: 'ApiError',
      message: 'HTTP 502',
      status: 502,
      payload: null,
    });
  });
});
