/**
 * Resolve image URL for display. In production, image URLs from the API may be
 * relative (e.g. /uploads/...) or point to localhost; resolve against the API
 * base URL so the browser loads them from the correct origin.
 */
export function getImageUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  const base = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) || '';
  const apiBase = base.replace(/\/+$/, '');

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const lower = trimmed.toLowerCase();
    if (apiBase && (lower.includes('localhost') || lower.includes('127.0.0.1'))) {
      try {
        const u = new URL(trimmed);
        const pathPart = u.pathname + (u.search || '') + (u.hash || '');
        return `${apiBase}${pathPart.startsWith('/') ? pathPart : '/' + pathPart}`;
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }

  return apiBase ? `${apiBase}${trimmed.startsWith('/') ? '' : '/'}${trimmed}` : trimmed;
}
