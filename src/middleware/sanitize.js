const sanitizeHtml = require('sanitize-html');

const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Güvenli HTML etiketleri — forum/feed body'si için
const SAFE_HTML_OPTIONS = {
  allowedTags: ['b', 'i', 'u', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre'],
  allowedAttributes: { 'a': ['href', 'target', 'rel'] },
  allowedSchemes: ['http', 'https'],
  transformTags: {
    'a': (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, rel: 'noopener noreferrer', target: '_blank' },
    }),
  },
};

// String'den tehlikeli içerikleri temizle (tek satırlık alanlar için)
function stripDangerous(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/\0/g, '')  // null byte
    .replace(/<[^>]*>/g, ''); // tüm HTML tag'larını kaldır
}

// HTML içeren alanlar için güçlü sanitization (forum body, feed body, vb.)
function sanitizeRichText(str) {
  if (typeof str !== 'string') return str;
  return sanitizeHtml(str, SAFE_HTML_OPTIONS);
}

// req.body'deki tüm string değerleri recursive temizle
function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    sanitizeObj(req.body);
  }
  next();
}

const RICH_TEXT_KEYS = new Set(['body', 'content', 'description', 'text', 'message']);

function sanitizeObj(obj) {
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      // Rich text alanları için güçlü sanitization, diğerleri için strip
      obj[key] = RICH_TEXT_KEYS.has(key)
        ? sanitizeRichText(obj[key])
        : stripDangerous(obj[key]);
    } else if (Array.isArray(obj[key])) {
      sanitizeArray(obj[key], key);
    } else if (obj[key] && typeof obj[key] === 'object') {
      sanitizeObj(obj[key]);
    }
  }
}

function sanitizeArray(items, parentKey = '') {
  for (let i = 0; i < items.length; i += 1) {
    const value = items[i];

    if (typeof value === 'string') {
      items[i] = RICH_TEXT_KEYS.has(parentKey)
        ? sanitizeRichText(value)
        : stripDangerous(value);
      continue;
    }

    if (Array.isArray(value)) {
      sanitizeArray(value, parentKey);
      continue;
    }

    if (value && typeof value === 'object') {
      sanitizeObj(value);
    }
  }
}

// data URL'den MIME tipini çıkarıp izin verilen listede kontrol et
function validateImageMime(dataUrl) {
  if (typeof dataUrl !== 'string') return false;
  if (!dataUrl.startsWith('data:')) return true; // HTTP URL — bu middleware'de kontrol etme
  const match = dataUrl.match(/^data:([^;]+);base64,/);
  if (!match) return false;
  return ALLOWED_IMAGE_MIME.includes(match[1].toLowerCase());
}

module.exports = { sanitizeBody, validateImageMime, sanitizeRichText };
