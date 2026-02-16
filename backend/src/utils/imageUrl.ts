/**
 * Get the backend base URL for building absolute image URLs.
 * Used when returning product/store product data so the frontend can load images in production.
 */
function getBackendBaseUrl(): string {
  const url = process.env.BACKEND_URL || '';
  if (url) return url.replace(/\/+$/, '');
  return '';
}

/**
 * Extract pathname from a URL (e.g. http://localhost:5000/uploads/foo.png -> /uploads/foo.png).
 */
function getPathFromUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname + (u.search || '') + (u.hash || '');
  } catch {
    return url.startsWith('/') ? url : '/' + url;
  }
}

/**
 * Convert a single image URL to absolute and production-safe.
 * - Relative paths (e.g. /uploads/...) are resolved against BACKEND_URL.
 * - URLs pointing to localhost/127.0.0.1 are rewritten to BACKEND_URL so they work in production.
 */
export function toAbsoluteImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return url;
  const trimmed = url.trim();
  if (!trimmed) return url;

  const base = getBackendBaseUrl();

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const lower = trimmed.toLowerCase();
    if (base && (lower.includes('localhost') || lower.includes('127.0.0.1'))) {
      const pathPart = getPathFromUrl(trimmed);
      return `${base}${pathPart.startsWith('/') ? pathPart : '/' + pathPart}`;
    }
    return trimmed;
  }

  if (!base) return url;
  return `${base}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

/**
 * Convert an array of image URLs to absolute. Safe to pass undefined or non-arrays.
 */
export function toAbsoluteImageUrls(images: string[] | undefined | null): string[] {
  if (!Array.isArray(images)) return [];
  return images.map(toAbsoluteImageUrl);
}
