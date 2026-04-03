import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch, API_BASE } from '../api';

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

    await expect(apiFetch<{ ok: boolean }>('/health', { body: JSON.stringify({ ping: true }) })).resolves.toEqual({ ok: true });

    const [url, init] = fetchSpy.mock.calls[0] ?? [];
    expect(url).toBe(`${API_BASE}/health`);
    expect(init).toMatchObject({
      credentials: 'include',
    });
    expect(new Headers((init as RequestInit).headers).get('Content-Type')).toBe('application/json');
  });

  it('throws status fallback for non-JSON error payloads', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response('server down', { status: 502 }));

    await expect(apiFetch('/health')).rejects.toMatchObject({
      code: 'HTTP_502',
      message: 'HTTP 502',
      status: 502,
    });
  });

  it('returns null for 204 responses', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

    await expect(apiFetch<null>('/health')).resolves.toBeNull();
  });

  it('uses standardized JSON error fields', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ code: 'UNAUTHORIZED', message: 'Unauthorized', status: 401 }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    try {
      await apiFetch('/secure');
      throw new Error('expected apiFetch to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
        status: 401,
      });
    }
  });
});
