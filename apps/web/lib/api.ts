import { joinUrl } from './url';

export type ApiErrorModel = {
  code: string;
  message: string;
  status: number;
};

export const API_BASE = joinUrl(process.env.NEXT_PUBLIC_API_BASE ?? process.env.API_BASE ?? '', '');

export function getHealthEndpoint(): string | null {
  return API_BASE ? `${API_BASE}/health` : null;
}

export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly payload: unknown;

  constructor(model: ApiErrorModel, payload: unknown) {
    super(model.message);
    this.name = 'ApiError';
    this.code = model.code;
    this.status = model.status;
    this.payload = payload;
  }
}

function isJsonResponse(res: Response): boolean {
  const contentType = res.headers.get('Content-Type')?.toLowerCase() ?? '';
  return contentType.includes('application/json');
}

function normalizeApiError(payload: unknown, status: number): ApiErrorModel {
  const fallback: ApiErrorModel = {
    code: `HTTP_${status}`,
    message: `HTTP ${status}`,
    status,
  };

  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const data = payload as {
    code?: unknown;
    message?: unknown;
    error?: unknown;
    status?: unknown;
  };

  return {
    code: typeof data.code === 'string' && data.code.trim().length > 0 ? data.code : fallback.code,
    message:
      typeof data.message === 'string' && data.message.trim().length > 0
        ? data.message
        : typeof data.error === 'string' && data.error.trim().length > 0
          ? data.error
          : fallback.message,
    status: typeof data.status === 'number' ? data.status : status,
  };
}

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
    const payload = isJsonResponse(res) ? await res.json().catch(() => null) : null;
    throw new ApiError(normalizeApiError(payload, res.status), payload);
  }

  if (res.status === 204) {
    return null as T;
  }

  if (!isJsonResponse(res)) {
    return null as T;
  }

  return (await res.json()) as T;
}
