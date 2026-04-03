(function initSanitizeHelpers(global) {
  function escapeText(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  function sanitizeUrl(rawUrl, options = {}) {
    const str = String(rawUrl ?? '').trim();
    if (!str) return '';

    const allowedProtocols = options.allowedProtocols || ['https:'];
    const allowedHosts = (options.allowedHosts || []).map((h) => String(h || '').toLowerCase()).filter(Boolean);

    let parsed;
    try {
      parsed = new URL(str, global.location.origin);
    } catch (_) {
      return '';
    }

    if (!allowedProtocols.includes(parsed.protocol)) return '';

    if (allowedHosts.length) {
      const host = parsed.hostname.toLowerCase();
      const hostAllowed = allowedHosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
      if (!hostAllowed) return '';
    }

    return parsed.toString();
  }

  global.SafeRender = { escapeText, sanitizeUrl };
})(window);
