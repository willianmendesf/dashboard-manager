import { environment } from '../../../environments/environment';

/**
 * Builds image URLs like appointments component
 * Backend returns only filename, frontend constructs the full URL
 */
export function buildFileImageUrl(filename: string | null | undefined, folder: string = 'profiles'): string {
  if (!filename || filename.trim() === '') {
    return './img/avatar-default.png';
  }

  // If already a full URL or relative path, return as is (for backward compatibility)
  if (filename.startsWith('/') || filename.startsWith('http')) {
    // Extract just the filename if it's a URL
    const urlParts = filename.split('/');
    const extractedFilename = urlParts[urlParts.length - 1];
    if (extractedFilename && !extractedFilename.includes('?')) {
      return `${environment.apiUrl}files/${folder}/${extractedFilename}`;
    }
    // If we can't extract, use normalize approach
    return filename.startsWith('/') ? `${window.location.origin}${filename}` : filename;
  }

  // Construct URL like appointments: env + 'files/folder/filename'
  return `${environment.apiUrl}files/${folder}/${filename}`;
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

