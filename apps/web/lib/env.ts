declare global {
  interface Window {
    __API_BASE__?: string;
  }
}

function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const runtimeApiBase = window.__API_BASE__?.trim().replace(/\/+$/, '');
    if (runtimeApiBase) return runtimeApiBase;
  }

  const rawApiBase = process.env.API_BASE ?? process.env.NEXT_PUBLIC_API_BASE ?? '';
  const normalizedApiBase = rawApiBase.trim().replace(/\/+$/, '');

  if (!normalizedApiBase && process.env.NODE_ENV !== 'production') {
    return '/api';
  }

  return normalizedApiBase;
}

export const API_BASE = getApiBase();

export function hasApiBase(): boolean {
  return API_BASE.length > 0;
}

export function getApiBaseFallbackMessage(): string {
  return 'API bağlantısı yapılandırılamadı: API_BASE (server) veya NEXT_PUBLIC_API_BASE (client) ortam değişkenini tam URL olarak tanımlayın.';
}
