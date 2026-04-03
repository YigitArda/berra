import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let apiFetch: <T>(path: string, init?: RequestInit) => Promise<T>;
let apiBase: string;
let joinApiUrl: (base: string, path: string) => string;

describe('apiFetch', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv('API_BASE', 'http://localhost:4000/api');

    const apiModule = await import('../api');
    const urlModule = await import('../url');

    apiFetch = apiModule.apiFetch;
    apiBase = apiModule.API_BASE;
    joinApiUrl = urlModule.joinApiUrl;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('returns parsed JSON response', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(apiFetch<{ ok: boolean }>('/health')).resolves.toEqual({ ok: true });

    expect(fetchSpy).toHaveBeenCalledWith(joinApiUrl(apiBase, '/health'), {
      credentials: 'include',
      headers: expect.any(Headers),
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
