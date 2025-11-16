import { environment } from '../../../environments/environment';

/**
 * Constrói URL completa removendo barras duplicadas
 */
function buildApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const baseUrl = environment.apiUrl.endsWith('/') ? environment.apiUrl : environment.apiUrl + '/';
  return baseUrl + cleanPath;
}

/**
 * Builds image URLs like appointments component
 * Backend returns relative path (URI), frontend constructs the full URL
 * Handles both new format (relative path) and old format (full URLs with localhost)
 */
export function buildFileImageUrl(pathOrFilename: string | null | undefined, folder: string = 'profiles'): string {
  if (!pathOrFilename || pathOrFilename.trim() === '') {
    return './img/avatar-default.png';
  }

  const trimmed = pathOrFilename.trim();

  // If it's already a relative path starting with /api/v1/files/, use it directly
  if (trimmed.startsWith('/api/v1/files/')) {
    return `${window.location.origin}${trimmed}`;
  }

  // If it's a full URL (old format with localhost), extract the path
  if (trimmed.startsWith('http')) {
    try {
      // Remove query strings first
      const withoutQuery = trimmed.split('?')[0];
      const url = new URL(withoutQuery);
      const path = url.pathname;
      
      // If it contains /api/v1/files/, use that path
      if (path.startsWith('/api/v1/files/')) {
        return `${window.location.origin}${path}`;
      }
      
      // Try to extract folder and filename from URL
      const pathMatch = path.match(/\/api\/v1\/files\/([^\/]+)\/([^\/]+)$/);
      if (pathMatch) {
        return buildApiUrl(`files/${pathMatch[1]}/${pathMatch[2]}`);
      }
    } catch (e) {
      console.warn('Failed to parse URL:', trimmed);
    }
  }

  // If it's just a filename (fallback for old data), construct path
  // This should not happen with new uploads, but handles legacy data
  if (!trimmed.includes('/')) {
    return buildApiUrl(`files/${folder}/${trimmed}`);
  }

  // If it's a relative path starting with /, use window.location.origin
  if (trimmed.startsWith('/')) {
    return `${window.location.origin}${trimmed}`;
  }

  // Final fallback
  return buildApiUrl(`files/${folder}/${trimmed}`);
}

/**
 * Helper for user/member profile photos
 */
export function buildProfileImageUrl(filename: string | null | undefined): string {
  return buildFileImageUrl(filename, 'profiles');
}

/**
 * Helper for logo images
 */
export function buildLogoImageUrl(filename: string | null | undefined): string {
  return buildFileImageUrl(filename, 'logos');
}

/**
 * Helper for favicon images
 */
export function buildFaviconImageUrl(filename: string | null | undefined): string {
  return buildFileImageUrl(filename, 'favicons');
}

/**
 * Helper for book images
 */
export function buildBookImageUrl(filename: string | null | undefined): string {
  return buildFileImageUrl(filename, 'books');
}

