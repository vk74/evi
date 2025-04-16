/**
 * cache.settings.ts
 * In-memory cache for application settings.
 */

import { AppSetting, SettingsCache } from './types.settings';

// In-memory cache object
let settingsCache: SettingsCache = {};

// Logging helper
function logCache(message: string, meta?: object): void {
  console.log(`[${new Date().toISOString()}] [SettingsCache] ${message}`, meta || '');
}

/**
 * Generate cache key from section_path and setting_name
 * This should match the key generation in service.load.settings.ts
 */
function generateCacheKey(sectionPath: string, settingName: string): string {
  return `${sectionPath}/${settingName}`;
}

/**
 * Set the entire cache contents
 * @param settings Array of settings to cache
 */
export function setCache(settings: AppSetting[]): void {
  settingsCache = settings.reduce((cache, setting) => {
    // Use both section_path and setting_name to create unique key
    const cacheKey = generateCacheKey(setting.section_path, setting.setting_name);
    cache[cacheKey] = setting;
    return cache;
  }, {} as SettingsCache);
  
  logCache('Settings cache updated', { 
    settingsCount: settings.length,
    sections: [...new Set(settings.map(s => s.section_path))]
  });
}

/**
 * Clear the entire cache
 */
export function clearCache(): void {
  settingsCache = {};
  logCache('Settings cache cleared');
}

/**
 * Get a setting value by section path and name
 * @param sectionPath The section path of the setting
 * @param settingName The unique name of the setting
 * @returns The setting value or null if not found
 */
export function getSetting(sectionPath: string, settingName: string): AppSetting | null {
  const cacheKey = generateCacheKey(sectionPath, settingName);
  const setting = settingsCache[cacheKey];
  
  if (!setting) {
    logCache('Setting not found in cache', { sectionPath, settingName });
    return null;
  }

  logCache('Setting retrieved from cache', { 
    sectionPath,
    settingName
  });
  
  return setting;
}

/**
 * Get all cached settings
 * @returns Object containing all cached settings
 */
export function getAllSettings(): SettingsCache {
  logCache('Retrieved all settings from cache', { 
    settingsCount: Object.keys(settingsCache).length 
  });
  return settingsCache;
}

/**
 * Check if a setting exists in cache
 * @param sectionPath The section path of the setting
 * @param settingName The unique name of the setting
 * @returns boolean indicating if setting exists
 */
export function hasSetting(sectionPath: string, settingName: string): boolean {
  const cacheKey = generateCacheKey(sectionPath, settingName);
  return cacheKey in settingsCache;
}

/**
 * Parse setting value based on its type
 * @param setting The setting to parse
 * @returns The parsed value
 */
export function parseSettingValue(setting: AppSetting): any {
  try {
    // Value is already stored as a proper type in jsonb field
    return setting.value !== null ? setting.value : setting.default_value;
  } catch (error) {
    logCache('Error parsing setting value', {
      settingName: setting.setting_name,
      error
    });
    return null;
  }
}