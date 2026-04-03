export function createTemplateHelpers(escapeHtml) {
  const raw = (value = '') => ({ __htmlRaw: String(value) });

  const html = (strings, ...values) => strings.reduce((acc, part, index) => {
    const value = values[index];
    let safeValue = '';

    if (value && typeof value === 'object' && value.__htmlRaw !== undefined) {
      safeValue = String(value.__htmlRaw);
    } else if (value !== undefined) {
      safeValue = escapeHtml(value);
    }

    return acc + part + safeValue;
  }, '');

  const sanitizeUrl = (value) => {
    const input = String(value ?? '').trim();
    if (!input) return '';

    if (input.startsWith('data:image/')) return input;

    if (window.SafeRender?.sanitizeUrl) {
      return window.SafeRender.sanitizeUrl(input, { allowedProtocols: ['https:', 'http:'] });
    }

    try {
      const parsed = new URL(input, window.location.origin);
      return ['https:', 'http:'].includes(parsed.protocol) ? parsed.toString() : '';
    } catch (_) {
      return '';
    }
  };

  return { html, raw, sanitizeUrl };
}
