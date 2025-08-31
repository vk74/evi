/**
 * plugins/webfontloader.ts
 * Version: 1.1.0
 * Purpose: Previously used webfontloader; now Roboto is provided via roboto-fontface package.
 * This module remains to avoid import breakage but performs no runtime loading.
 */

export async function loadFonts(): Promise<void> {
  // No-op: fonts are provided via roboto-fontface CSS
  return
} 