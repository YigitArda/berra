const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// String'den tehlikeli içerikleri temizle
function stripDangerous(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/\0/g, '')                              // null byte
    .replace(/<script[\s\S]*?<\/script>/gi, '')      // <script> blokları
    .replace(/javascript\s*:/gi, '');                // javascript: protokolü
}

// req.body'deki tüm string değerleri recursive temizle
function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    sanitizeObj(req.body);
  }
  next();
}

function sanitizeObj(obj) {
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      obj[key] = stripDangerous(obj[key]);
    } else if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      sanitizeObj(obj[key]);
    }
  }
}

// data URL'den MIME tipini çıkarıp izin verilen listede kontrol et
function validateImageMime(dataUrl) {
  if (typeof dataUrl !== 'string') return false;
  if (!dataUrl.startsWith('data:')) return true; // HTTP URL — bu middleware'de kontrol etme
  const match = dataUrl.match(/^data:([^;]+);base64,/);
  if (!match) return false;
  return ALLOWED_IMAGE_MIME.includes(match[1]);
}

module.exports = { sanitizeBody, validateImageMime };
