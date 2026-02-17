/**
 * @file helpers.check.cookies.supported.ts
 * Version: 1.0.0
 * Helper functions for checking cookie support in the frontend.
 * Frontend file that provides helper functions for cookie management.
 */

/**
 * Checks if cookies are supported in the current browser
 */
export function areCookiesSupported(): boolean {
  try {
    document.cookie = 'test=1';
    const hasCookie = document.cookie.indexOf('test=') !== -1;
    document.cookie = 'test=1; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    return hasCookie;
  } catch (e) {
    return false;
  }
}

export function areHttpOnlyCookiesSupported(): boolean {
  // Modern browsers support httpOnly cookies
  // This is mainly a server-side feature, but we can check for basic cookie support
  return areCookiesSupported();
}

/**
 * Gets the current environment (development/production)
 */
export function getEnvironment(): 'development' | 'production' {
  return import.meta.env.PROD ? 'production' : 'development';
}

/**
 * Logs cookie-related information for debugging
 */
export function logCookieInfo(): void {
  console.log('[Cookie Utils] Environment:', getEnvironment());
  console.log('[Cookie Utils] Cookies supported:', areCookiesSupported());
  console.log('[Cookie Utils] HttpOnly cookies supported:', areHttpOnlyCookiesSupported());
  
  // Log current cookies (excluding httpOnly ones which won't be visible)
  const cookies = document.cookie.split(';').map(cookie => cookie.trim());
  console.log('[Cookie Utils] Available cookies:', cookies);
} 