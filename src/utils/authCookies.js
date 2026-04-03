const isProd = process.env.NODE_ENV === 'production';

const ACCESS_COOKIE_NAME = 'token';
const REFRESH_COOKIE_NAME = 'refresh_token';
const ACCESS_COOKIE_MAX_AGE_MS = 15 * 60 * 1000; // 15 dakika
const REFRESH_COOKIE_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000; // 14 gün

function buildCookieOptions(maxAge) {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    ...(typeof maxAge === 'number' ? { maxAge } : {}),
  };
}

module.exports = {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  ACCESS_COOKIE_MAX_AGE_MS,
  REFRESH_COOKIE_MAX_AGE_MS,
  buildCookieOptions,
};
