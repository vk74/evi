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
 * Set the entire cache contents
 * @param settings Array of settings to cache
 */
export function setCache(settings: AppSetting[]): void {
  settingsCache = settings.reduce((cache, setting) => {
    cache[setting.setting_name] = setting;
    return cache;
  }, {} as SettingsCache);
  
  logCache('Settings cache updated', { 
    settingsCount: settings.length,
    sections: [...new Set(settings.map(s => s.sections_path))]
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
 * Get a setting value by name
 * @param settingName The unique name of the setting
 * @returns The setting value or null if not found
 */
export function getSetting(settingName: string): AppSetting | null {
  const setting = settingsCache[settingName];
  
  if (!setting) {
    logCache('Setting not found in cache', { settingName });
    return null;
  }

  logCache('Setting retrieved from cache', { 
    settingName,
    sectionsPath: setting.sections_path 
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
 * @param settingName The unique name of the setting
 * @returns boolean indicating if setting exists
 */
export function hasSetting(settingName: string): boolean {
  return settingName in settingsCache;
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