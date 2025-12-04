/**
 * Ensures image URLs use HTTPS protocol
 * Converts HTTP URLs to HTTPS to prevent mixed content warnings
 */
export function ensureHttps(url: string | undefined | null): string {
  if (!url) return '';

  // If it's already HTTPS or a relative URL, return as-is
  if (url.startsWith('https://') || url.startsWith('//') || url.startsWith('/')) {
    return url;
  }

  // For localhost / 127.0.0.1 we should NOT use HTTPS in dev
  if (
    url.startsWith('http://localhost') ||
    url.startsWith('http://127.0.0.1') ||
    url.startsWith('https://localhost') ||
    url.startsWith('https://127.0.0.1')
  ) {
    // Always normalize localhost URLs to HTTP to avoid SSL protocol errors
    return url.replace(/^https:\/\//i, 'http://');
  }

  // Convert HTTP to HTTPS for non-localhost URLs
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }

  // If it's some other URL (data:, etc.), return as-is
  return url;
}

/**
 * Gets a safe image URL that works in both HTTP and HTTPS contexts
 */
export function getSafeImageUrl(url: string | undefined | null): string {
  const safeUrl = ensureHttps(url);
  
  // If running in browser and on HTTPS, ensure URL is HTTPS
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return ensureHttps(safeUrl);
  }
  
  return safeUrl;
}

