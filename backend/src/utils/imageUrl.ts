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
 * Convert a single image URL to absolute if it is relative.
 * Relative paths (e.g. /uploads/...) are resolved against BACKEND_URL.
 */
export function toAbsoluteImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return url;
  const trimmed = url.trim();
  if (!trimmed) return url;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const base = getBackendBaseUrl();
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
