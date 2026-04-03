import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, API_BASE, apiFetch } from '../api';

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

  it('returns parsed JSON response for JSON payloads', async () => {
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
      headers: new Headers(),
    });
    expect(new Headers((init as RequestInit).headers).get('Content-Type')).toBe('application/json');
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
