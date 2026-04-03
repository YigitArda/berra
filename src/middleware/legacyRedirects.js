const LEGACY_REDIRECT_ROUTES = [
  { pattern: /^\/feed\/?$/, target: '/feed', status: 301 },
  { pattern: /^\/notifications\/?$/, target: '/notifications', status: 301 },
  { pattern: /^\/login\/?$/, target: '/login', status: 301 },
  { pattern: /^\/register\/?$/, target: '/register', status: 301 },
  { pattern: /^\/thread\/([^/?#]+)\/?$/, target: '/thread/:slug', status: 302 },
];

function mapTargetPath(target, reqPath) {
  if (!target.includes(':slug')) return target;
  const match = reqPath.match(/^\/thread\/([^/?#]+)\/?$/);
  return target.replace(':slug', match?.[1] || '');
}

function legacyRedirects(req, res, next) {
  if (req.method !== 'GET') return next();

  const nextBase = process.env.NEXT_APP_URL;
  if (!nextBase) return next();

  const route = LEGACY_REDIRECT_ROUTES.find((item) => item.pattern.test(req.path));
  if (!route) return next();

  const mappedPath = mapTargetPath(route.target, req.path);
  const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const targetUrl = new URL(`${mappedPath}${query}`, nextBase).toString();

  return res.redirect(route.status, targetUrl);
}

module.exports = {
  legacyRedirects,
  LEGACY_REDIRECT_ROUTES,
};
