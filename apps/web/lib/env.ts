// Runtime'da window'dan, build'da env'den al
function getApiBase(): string {
  // Browser'da runtime config kullan
  if (typeof window !== 'undefined') {
    // @ts-expect-error - runtime config
    const runtimeApiBase = window.__API_BASE__;
    if (runtimeApiBase) return runtimeApiBase;
  }
  
  // Build zamanında env değişkenlerini kullan
  const rawApiBase = process.env.API_BASE ?? process.env.NEXT_PUBLIC_API_BASE ?? '';
  return rawApiBase.trim().replace(/\/+$/, '');
}

export const API_BASE = getApiBase();

export function hasApiBase(): boolean {
  return API_BASE.length > 0;
}

export function getApiBaseFallbackMessage(): string {
  return 'API bağlantısı yapılandırılamadı: API_BASE (server) veya NEXT_PUBLIC_API_BASE (client) ortam değişkenini tam URL olarak tanımlayın.';
}
