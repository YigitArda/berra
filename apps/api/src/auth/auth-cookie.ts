export const ACCESS_COOKIE_NAME = 'token';
export const REFRESH_COOKIE_NAME = 'refresh_token';

export const ACCESS_COOKIE_MAX_AGE_SECONDS = 60 * 15; // 15 dakika
export const REFRESH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 gün

export function cookieOptions(isProd: boolean, maxAgeSeconds?: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProd,
    path: '/',
    ...(typeof maxAgeSeconds === 'number' ? { maxAge: maxAgeSeconds } : {}),
  };
}
