/**
 * Resolve image URL for display. In production, image URLs from the API may be
 * relative (e.g. /uploads/...) and must be resolved against the API base URL
 * so the browser loads them from the correct origin.
 */
export function getImageUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const base = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) || '';
  const apiBase = base.replace(/\/+$/, '');
  return apiBase ? `${apiBase}${trimmed.startsWith('/') ? '' : '/'}${trimmed}` : trimmed;
}
