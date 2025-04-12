/**
 * service.load.settings.ts
 * Service for loading and caching application settings.
 */

import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '../../../db/maindb';
import { queries } from './queries.settings';
import { AppSetting, SettingsCache, Environment, SettingsError } from './types.settings';

// Type assertion for pool
const pool = pgPool as Pool;

// In-memory cache object
let settingsCache: SettingsCache = {};

// Logging helper
function logService(message: string, meta?: object): void {
  console.log(`[${new Date().toISOString()}] [LoadSettingsService] ${message}`, meta || '');
}

/**
 * Generate cache key from sections_path and setting_name
 */
function generateCacheKey(sectionsPath: string, settingName: string): string {
  return `${sectionsPath}/${settingName}`;
}

/**
 * Load all settings from database into cache
 */
export async function loadSettings(): Promise<void> {
  try {
    logService('Starting to load settings from database');

    const result: QueryResult = await pool.query(queries.getAllSettings.text);
    
    if (!result.rows || result.rows.length === 0) {
      logService('No settings found in database');
      return;
    }

    // Clear existing cache
    settingsCache = {};

    // Transform query results and populate cache
    result.rows.forEach(row => {
      const setting: AppSetting = {
        ...row,
        value: row.value, // JSONB field, already parsed by pg
        validation_schema: row.validation_schema, // JSONB field
        default_value: row.default_value, // JSONB field
        updated_at: new Date(row.updated_at)
      };

      const cacheKey = generateCacheKey(setting.sections_path, setting.setting_name);
      settingsCache[cacheKey] = setting;
    });

    logService('Settings loaded successfully', {
      settingsCount: Object.keys(settingsCache).length,
      sections: [...new Set(Object.values(settingsCache).map(s => s.sections_path))]
    });

  } catch (error) {
    logService('Error loading settings', { error });
    const settingsError: SettingsError = {
      code: 'DB_ERROR',
      message: error instanceof Error ? error.message : 'Failed to load settings from database',
      details: error
    };
    throw settingsError;
  }
}

/**
 * Get setting by sections path and name
 */
export function getSetting(sectionsPath: string, settingName: string): AppSetting | null {
  const cacheKey = generateCacheKey(sectionsPath, settingName);
  const setting = settingsCache[cacheKey];
  
  if (!setting) {
    logService('Setting not found in cache', { sectionsPath, settingName });
    return null;
  }

  return setting;
}

/**
 * Get setting value by sections path and name
 * Returns parsed value or default value if setting not found
 */
export function getSettingValue(sectionsPath: string, settingName: string): any {
  const setting = getSetting(sectionsPath, settingName);
  
  if (!setting) {
    return null;
  }

  // If setting exists but value is null, try to use default_value
  if (setting.value === null && setting.default_value !== null) {
    return setting.default_value;
  }

  return setting.value;
}

/**
 * Get all settings in a specific section
 */
export function getSettingsBySection(sectionsPath: string): AppSetting[] {
  return Object.values(settingsCache).filter(
    setting => setting.sections_path.startsWith(sectionsPath)
  );
}

/**
 * Force reload all settings from database
 */
export async function reloadSettings(): Promise<void> {
  logService('Force reloading settings');
  await loadSettings();
}

/**
 * Initialize settings module
 * This should be called when the server starts
 */
export async function initializeSettings(): Promise<void> {
  try {
    logService('Initializing settings module');
    await loadSettings();
    logService('Settings module initialized successfully');
  } catch (error) {
    logService('Failed to initialize settings module', { error });
    throw error;
  }
}