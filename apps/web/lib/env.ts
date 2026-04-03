const rawApiBase = process.env.API_BASE ?? process.env.NEXT_PUBLIC_API_BASE ?? '';

export const API_BASE = rawApiBase.trim().replace(/\/+$/, '');

export function hasApiBase(): boolean {
  return API_BASE.length > 0;
}

export function getApiBaseFallbackMessage(): string {
  return 'API bağlantısı yapılandırılamadı: API_BASE (server) veya NEXT_PUBLIC_API_BASE (client) ortam değişkenini tam URL olarak tanımlayın.';
}
