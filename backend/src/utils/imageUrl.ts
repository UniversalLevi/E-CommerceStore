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

/** Image extension pattern for validating path-like strings */
const IMAGE_EXT = /\.(jpe?g|png|gif|webp)(\?|$)/i;

/**
 * True if the value looks like an image URL or file path, not a label (e.g. "Upload 1").
 * Permissive: any http(s) URL, path starting with /, or string containing / or a known image extension.
 */
export function isValidImageUrlOrPath(value: string): boolean {
  const s = value.trim();
  if (!s) return false;
  if (s.startsWith('http://') || s.startsWith('https://')) return true;
  if (s.startsWith('/')) return true; // e.g. /uploads/foo.jpg or /uploads/photo
  if (s.includes('/')) return true;   // e.g. uploads/foo.jpg
  if (IMAGE_EXT.test(s)) return true; // e.g. image-123.jpg
  return false;
}

/**
 * Convert a single image URL to absolute and production-safe.
 * - Returns '' for non-URL-like values (e.g. "Upload 1" labels) so they are not used as image src.
 * - Relative paths (e.g. /uploads/...) are resolved against BACKEND_URL.
 * - URLs pointing to localhost/127.0.0.1 are rewritten to BACKEND_URL so they work in production.
 */
export function toAbsoluteImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (!isValidImageUrlOrPath(trimmed)) return '';

  const base = getBackendBaseUrl();

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const lower = trimmed.toLowerCase();
    const isLegacyHost =
      lower.includes('localhost') ||
      lower.includes('127.0.0.1') ||
      lower.includes('eazydropshipping.com');
    if (base && isLegacyHost) {
      const pathPart = getPathFromUrl(trimmed);
      return `${base}${pathPart.startsWith('/') ? pathPart : '/' + pathPart}`;
    }
    return trimmed;
  }

  // When BACKEND_URL is not set, pass through so relative paths (e.g. /uploads/foo.jpg)
  // still work with same-origin; otherwise we would return '' and break valid images.
  if (!base) return trimmed;
  return `${base}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

/** Placeholder path (used by fixProductImages script when a product has no valid images). */
export const PLACEHOLDER_PRODUCT_IMAGE_PATH = '/uploads/placeholder-product.png';

/**
 * Convert an array of image URLs to absolute. Invalid or label-like entries are omitted.
 * Returns only real URLs from the DB; empty array when none valid (UI shows placeholder).
 * Safe to pass undefined or non-arrays.
 */
export function toAbsoluteImageUrls(images: string[] | undefined | null): string[] {
  if (!Array.isArray(images)) return [];
  return images.map(toAbsoluteImageUrl).filter(Boolean);
}
