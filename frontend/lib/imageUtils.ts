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
  
  // Convert HTTP to HTTPS
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  
  // If it's a relative URL or data URL, return as-is
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

