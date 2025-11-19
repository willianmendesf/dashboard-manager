/**
 * Screen Detection Utility
 * Reusable utility for detecting screen size and device type
 */

export interface ScreenInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTV: boolean; // Large screens (TVs, monitors > 1920px)
  pixelRatio: number;
}

/**
 * Gets current screen information
 */
export function getScreenInfo(): ScreenInfo {
  if (typeof window === 'undefined') {
    // SSR fallback
    return {
      width: 1920,
      height: 1080,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isTV: true,
      pixelRatio: 1
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = window.devicePixelRatio || 1;

  return {
    width,
    height,
    isMobile: width <= 999,
    isTablet: width > 999 && width <= 1280,
    isDesktop: width > 1280,
    isTV: width >= 1920, // Full HD and above
    pixelRatio
  };
}

/**
 * Checks if current device is a TV or large display
 */
export function isTVDisplay(): boolean {
  return getScreenInfo().isTV;
}

/**
 * Gets optimal image quality based on screen size
 * Returns quality parameter for image requests (0-1)
 */
export function getOptimalImageQuality(): number {
  const screenInfo = getScreenInfo();
  
  if (screenInfo.isTV) {
    return 1.0; // Full quality for TVs
  } else if (screenInfo.isDesktop) {
    return 0.9; // High quality for desktops
  } else if (screenInfo.isTablet) {
    return 0.8; // Medium quality for tablets
  } else {
    return 0.75; // Standard quality for mobile
  }
}

/**
 * Gets optimal image dimensions based on screen size
 */
export function getOptimalImageDimensions(): { width: number; height: number } {
  const screenInfo = getScreenInfo();
  
  if (screenInfo.isTV) {
    return { width: 1920, height: 1080 }; // Full HD
  } else if (screenInfo.isDesktop) {
    return { width: 1280, height: 720 }; // HD
  } else if (screenInfo.isTablet) {
    return { width: 1024, height: 768 }; // Tablet
  } else {
    return { width: 800, height: 600 }; // Mobile
  }
}

