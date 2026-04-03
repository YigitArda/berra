const LEGACY_REDIRECT_ROUTES = [
  // Core pages
  { pattern: /^\/$/, target: '/', status: 301 },
  { pattern: /^\/index\.html$/, target: '/', status: 301 },
  { pattern: /^\/feed\/?$/, target: '/feed', status: 301 },
  { pattern: /^\/notifications\/?$/, target: '/notifications', status: 301 },
  { pattern: /^\/login\/?$/, target: '/login', status: 301 },
  { pattern: /^\/register\/?$/, target: '/register', status: 301 },
  { pattern: /^\/search\/?$/, target: '/search', status: 301 },
  { pattern: /^\/dashboard\/?$/, target: '/dashboard', status: 301 },
  { pattern: /^\/bookmarks\/?$/, target: '/bookmarks', status: 301 },
  { pattern: /^\/following\/?$/, target: '/following', status: 301 },

  // Forum + thread
  { pattern: /^\/forum\/?$/, target: '/forum', status: 301 },
  { pattern: /^\/forum\/new\/?$/, target: '/forum/new', status: 301 },
  { pattern: /^\/thread\/([^/?#]+)\/?$/, target: '/thread/:slug', status: 301 },

  // Profile
  { pattern: /^\/profile\/me\/edit\/?$/, target: '/profile/me/edit', status: 301 },
  { pattern: /^\/profile\/([^/?#]+)\/?$/, target: '/profile/:username', status: 301 },

  // Models/discovery
  { pattern: /^\/models\/?$/, target: '/models', status: 301 },
  { pattern: /^\/models\/([^/?#]+)\/?$/, target: '/models/:slug', status: 301 },
  { pattern: /^\/tag\/([^/?#]+)\/?$/, target: '/tag/:slug', status: 301 },

  // Static legacy pages -> Next routes
  { pattern: /^\/rehber\.html$/, target: '/rehber', status: 301 },
  { pattern: /^\/sanayi\.html$/, target: '/sanayi', status: 301 },
  { pattern: /^\/karsilastir\.html$/, target: '/karsilastir', status: 301 },

  // Legacy post detail -> Next item route
  { pattern: /^\/post\/([^/?#]+)\/?$/, target: '/items/:id', status: 301 },
];

function mapTargetPath(target, reqPath) {
  const matchers = [
    { regex: /^\/thread\/([^/?#]+)\/?$/, param: ':slug' },
    { regex: /^\/profile\/([^/?#]+)\/?$/, param: ':username' },
    { regex: /^\/models\/([^/?#]+)\/?$/, param: ':slug' },
    { regex: /^\/tag\/([^/?#]+)\/?$/, param: ':slug' },
    { regex: /^\/post\/([^/?#]+)\/?$/, param: ':id' },
  ];

  let mapped = target;
  for (const matcher of matchers) {
    if (!mapped.includes(matcher.param)) continue;
    const match = reqPath.match(matcher.regex);
    mapped = mapped.replace(matcher.param, match?.[1] || '');
  }

  return mapped;
}

function legacyRedirects(req, res, next) {
  if (req.method !== 'GET') return next();

  const activeUi = (process.env.ACTIVE_UI || 'legacy').toLowerCase();
  if (activeUi !== 'next') return next();

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
