export function joinUrl(base: string, path: string): string {
  const normalizedBase = base.replace(/\/+$/, '');
  const normalizedPath = path.replace(/^\/+/, '');

  if (!normalizedPath) {
    return normalizedBase;
  }

  return `${normalizedBase}/${normalizedPath}`;
}

export function joinApiUrl(base: string, path: string): string {
  const normalizedBase = base.replace(/\/+$/, '');
  const baseEndsWithApi = normalizedBase.endsWith('/api');
  const normalizedPath = (path.startsWith('/') ? path : `/${path}`).replace(/^\/api(?=\/|$)/, '');

  if (baseEndsWithApi) {
    return joinUrl(normalizedBase, normalizedPath);
  }

  return joinUrl(normalizedBase, path);
}
