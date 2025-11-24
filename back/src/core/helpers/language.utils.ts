/**
 * language.utils.ts - version 1.0.0
 * 
 * Purpose: Helper utilities for resolving application languages.
 * Logic: Normalizes legacy language codes to full names and resolves
 *        requested and fallback languages based on app settings.
 * File type: Backend helper file (language.utils.ts)
 * 
 * Changes in v1.0.0:
 * - Added normalizeLanguageValue helper for mapping legacy codes (en/ru) to full names
 * - Added resolveCatalogLanguages helper to:
 *   - Load allowed.languages and fallback.language from app settings
 *   - Normalize and validate requested language against allowed list
 *   - Guarantee non-empty requested and fallback languages for catalog services
 */

import { getSettingValue } from './get.setting.value';

/**
 * Normalizes a language identifier to a canonical full-name value.
 * - Maps legacy codes like 'en', 'ru' to 'english', 'russian'
 * - Trims and lowercases input
 * - Passes through unknown values to support future languages
 */
export function normalizeLanguageValue(input: unknown): string | null {
  if (input === null || input === undefined) {
    return null;
  }

  const raw = String(input).trim();
  if (!raw) {
    return null;
  }

  const lower = raw.toLowerCase();

  // Legacy short codes mapping
  if (lower === 'en' || lower === 'en-us' || lower === 'eng') {
    return 'english';
  }
  if (lower === 'ru' || lower === 'ru-ru' || lower === 'rus') {
    return 'russian';
  }

  // Canonical full names or future languages are passed through
  return lower;
}

/**
 * Resolves requested and fallback languages for catalog/product services.
 * - Reads allowed.languages and fallback.language from app settings
 * - Normalizes both settings values and requested language
 * - Ensures requestedLanguage is always a valid value:
 *   - If requested is missing or not allowed, uses fallbackLanguage
 *   - If fallbackLanguage is not in allowed list, uses the first allowed value
 */
export async function resolveCatalogLanguages(
  requestedLanguageRaw: string | null | undefined
): Promise<{
  requestedLanguage: string;
  fallbackLanguage: string;
  allowedLanguages: string[];
}> {
  // Load allowed languages (array of full names) and fallback language (full name)
  const allowedLanguagesSetting = await getSettingValue<string[]>(
    'Application.RegionalSettings',
    'allowed.languages',
    ['english', 'russian']
  );

  const fallbackLanguageSetting = await getSettingValue<string>(
    'Application.RegionalSettings',
    'fallback.language',
    'english'
  );

  // Normalize settings values
  const allowedLanguagesNormalized = Array.isArray(allowedLanguagesSetting)
    ? allowedLanguagesSetting
        .map(value => normalizeLanguageValue(value))
        .filter((value): value is string => Boolean(value))
    : [];

  let fallbackLanguage = normalizeLanguageValue(fallbackLanguageSetting) || 'english';

  // Ensure fallbackLanguage is part of allowedLanguages if possible
  if (allowedLanguagesNormalized.length > 0 && !allowedLanguagesNormalized.includes(fallbackLanguage)) {
    fallbackLanguage = allowedLanguagesNormalized[0];
  }

  // Normalize requested language from the request
  let requestedLanguage = normalizeLanguageValue(requestedLanguageRaw);

  // If requested is missing or not allowed, fall back to resolved fallbackLanguage
  if (
    !requestedLanguage ||
    (allowedLanguagesNormalized.length > 0 && !allowedLanguagesNormalized.includes(requestedLanguage))
  ) {
    requestedLanguage = fallbackLanguage;
  }

  return {
    requestedLanguage,
    fallbackLanguage,
    allowedLanguages: allowedLanguagesNormalized
  };
}


