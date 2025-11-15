/**
 * Utility to normalize image URLs from backend
 * Handles:
 * - URLs with localhost/127.0.0.1 (converts to relative)
 * - Relative URLs (starts with /)
 * - Absolute URLs (keeps as is if valid)
 */
export function normalizeImageUrl(url: string | null | undefined): string {
  if (!url || url.trim() === '') {
    return './img/avatar-default.png';
  }

  const trimmedUrl = url.trim();

  // If URL contains localhost or 127.0.0.1, extract the path and make it relative
  if (trimmedUrl.includes('localhost') || trimmedUrl.includes('127.0.0.1')) {
    try {
      const urlObj = new URL(trimmedUrl);
      return urlObj.pathname + urlObj.search;
    } catch {
      // If URL parsing fails, try to extract path manually
      const pathMatch = trimmedUrl.match(/\/api\/v1\/.*/);
      if (pathMatch) {
        return pathMatch[0];
      }
    }
  }

  // If already relative (starts with /), prepend window.location.origin
  if (trimmedUrl.startsWith('/')) {
    return `${window.location.origin}${trimmedUrl}`;
  }

  // If starts with http/https and is valid, use as is
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }

  // Default fallback
  return './img/avatar-default.png';
}

