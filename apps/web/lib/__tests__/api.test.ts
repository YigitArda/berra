import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiFetch, API_BASE } from '../api';

describe('apiFetch', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns parsed JSON response', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(apiFetch<{ ok: boolean }>('/health')).resolves.toEqual({ ok: true });

    expect(fetchSpy).toHaveBeenCalledWith(`${API_BASE}/health`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('throws status fallback for non-JSON error payloads', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response('server down', { status: 502 }));

    await expect(apiFetch('/health')).rejects.toThrow('HTTP 502');
  });

  it('returns null for 204 responses', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

    await expect(apiFetch<null>('/health')).resolves.toBeNull();
  });

  it('prefers error fallback keys from JSON error payloads', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(apiFetch('/secure')).rejects.toThrow('Unauthorized');
  });
});
