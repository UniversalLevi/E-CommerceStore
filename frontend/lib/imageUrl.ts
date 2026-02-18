/** Image extension pattern for validating path-like strings */
const IMAGE_EXT = /\.(jpe?g|png|gif|webp)(\?|$)/i;

/** True if the value looks like an image URL or path, not a label (e.g. "Upload 1"). */
function isValidImageUrlOrPath(value: string): boolean {
  const s = value.trim();
  if (!s) return false;
  if (s.startsWith('http://') || s.startsWith('https://')) return true;
  if (s.startsWith('/')) return true;
  if (s.includes('/')) return true;   // e.g. uploads/foo or uploads/photo
  if (IMAGE_EXT.test(s)) return true;
  return false;
}

/**
 * Resolve image URL for display. In production, image URLs from the API may be
 * relative (e.g. /uploads/...) or point to localhost; resolve against the API
 * base URL so the browser loads them from the correct origin.
 * Returns '' for non-URL-like values (e.g. "Upload 1") so placeholders are shown instead.
 */
export function getImageUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed || !isValidImageUrlOrPath(trimmed)) return '';
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

/** Return the first valid image URL from an array (skips label-like or invalid entries). */
export function getFirstValidImageUrl(images: string[] | undefined | null): string {
  if (!Array.isArray(images)) return '';
  for (const u of images) {
    const resolved = getImageUrl(u);
    if (resolved) return resolved;
  }
  return '';
}
