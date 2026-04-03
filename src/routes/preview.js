const express = require('express');
const router  = express.Router();
const https   = require('https');
const http    = require('http');
const url     = require('url');

// Güvenli domain listesi
const ALLOWED_DOMAINS = [
  'sahibinden.com',
  'arabam.com',
  'araba.com',
  'autoscout24.com.tr',
  'mobile.de',
];

// Özel/iç ağ IP'lerini engelle (SSRF koruması)
const BLOCKED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]', '169.254.169.254'];
const PRIVATE_IP_RE = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/;
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);
const MAX_REDIRECTS = 2;

function isAllowed(urlStr) {
  try {
    const parsed = new url.URL(urlStr);
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) return false;
    if (BLOCKED_HOSTS.includes(parsed.hostname)) return false;
    if (PRIVATE_IP_RE.test(parsed.hostname)) return false;
    return ALLOWED_DOMAINS.some(d => parsed.hostname.endsWith(d));
  } catch { return false; }
}

function fetchPage(urlStr) {
  return new Promise((resolve, reject) => {
    const parsed = new url.URL(urlStr);
    const lib    = parsed.protocol === 'https:' ? https : http;
    const req    = lib.get({
      hostname: parsed.hostname,
      path:     parsed.pathname + parsed.search,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; bot/1.0)',
        'Accept': 'text/html',
      },
      timeout: 6000,
    }, (res) => {
      // Redirect takibi (max 2)
      if ([301, 302, 303, 307].includes(res.statusCode) && res.headers.location) {
        return resolve({ redirectTo: res.headers.location });
      }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { if (body.length < 80000) body += chunk; });
      res.on('end', () => resolve({ body }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function extractMeta(html, urlStr) {
  const get = (pattern) => {
    const m = html.match(pattern);
    return m ? m[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim() : null;
  };

  const title = get(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)
             || get(/<meta[^>]+name="title"[^>]+content="([^"]+)"/i)
             || get(/<title>([^<]+)<\/title>/i);

  const description = get(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i)
                   || get(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i);

  const image = get(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i);

  const price = get(/(\d[\d.,]+\s*(?:TL|₺|EUR|€))/i)
             || get(/<span[^>]*class="[^"]*price[^"]*"[^>]*>([^<]+)</i);

  // Site adı
  const parsed  = new url.URL(urlStr);
  const sitemap = {
    'sahibinden.com': 'Sahibinden.com',
    'arabam.com':     'Arabam.com',
    'autoscout24.com.tr': 'AutoScout24',
    'mobile.de':      'mobile.de',
  };
  const site = Object.entries(sitemap).find(([k]) => parsed.hostname.includes(k))?.[1] || parsed.hostname;

  return { title, description, image, price, site, url: urlStr };
}

// POST /api/preview
router.post('/', async (req, res) => {
  const { url: urlStr } = req.body;
  if (!urlStr) return res.status(422).json({ error: 'URL gerekli.' });
  if (!isAllowed(urlStr)) return res.status(403).json({ error: 'Bu site desteklenmiyor.' });

  try {
    let resolvedUrl = urlStr;
    let result = null;

    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
      if (!isAllowed(resolvedUrl)) {
        return res.status(403).json({ error: 'Yönlendirme güvenli değil.' });
      }

      result = await fetchPage(resolvedUrl);
      if (!result.redirectTo) break;

      if (redirectCount === MAX_REDIRECTS) {
        return res.status(400).json({ error: 'Çok fazla yönlendirme.' });
      }

      const redirectUrl = result.redirectTo.startsWith('http')
        ? result.redirectTo
        : new url.URL(result.redirectTo, resolvedUrl).toString();

      if (!isAllowed(redirectUrl)) {
        return res.status(403).json({ error: 'Yönlendirme güvenli değil.' });
      }

      resolvedUrl = redirectUrl;
    }

    if (!result.body) return res.status(500).json({ error: 'Sayfa yüklenemedi.' });

    const meta = extractMeta(result.body, resolvedUrl);
    res.json(meta);
  } catch (err) {
    console.error('preview error:', err.message);
    res.status(500).json({ error: 'Önizleme alınamadı.' });
  }
});

module.exports = router;
