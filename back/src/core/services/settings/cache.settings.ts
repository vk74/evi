/**
 * cache.settings.ts - backend file
 * version: 1.0.04
 * In-memory cache for application settings.
 * Uses simple console.log for logging with consistent format.
 */

import { AppSetting, SettingsCache } from './types.settings';

// In-memory cache object
let settingsCache: SettingsCache = {};

/**
 * Helper function for consistent log format
 * @param level Log level (INFO, WARN, ERROR, DEBUG)
 * @param message Message to log
 * @param details Optional details to include
 */
function logMessage(level: string, message: string, details?: any): void {
  console.log(`[${new Date().toISOString()}] [${level}] [SettingsCache] ${message}`, details || '');
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
  
  logMessage('INFO', 'Settings cache updated', { 
    settingsCount: settings.length,
    sections: [...new Set(settings.map(s => s.section_path))]
  });
}

/**
 * Clear the entire cache
 */
export function clearCache(): void {
  settingsCache = {};
  logMessage('INFO', 'Settings cache cleared');
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
    logMessage('WARN', 'Setting not found in cache', { sectionPath, settingName });
    return null;
  }

  return setting;
}

/**
 * Get all cached settings
 * @returns Object containing all cached settings
 */
export function getAllSettings(): SettingsCache {
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
    logMessage('ERROR', 'Error parsing setting value', {
      settingName: setting.setting_name,
      error: error instanceof Error ? error.message : error
    });
    return null;
  }
}

/**
 * Update a single setting in the cache
 * @param setting The updated setting object to cache
 * @returns boolean indicating if the update was successful
 */
export function updateCachedSetting(setting: AppSetting): boolean {
  const cacheKey = generateCacheKey(setting.section_path, setting.setting_name);
  
  // Update the setting in cache
  settingsCache[cacheKey] = setting;
  
  logMessage('DEBUG', 'Setting updated in cache', { 
    sectionPath: setting.section_path,
    settingName: setting.setting_name 
  });
  
  return true;
}