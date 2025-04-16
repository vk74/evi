/**
 * service.load.settings.ts
 * Service for loading and caching application settings.
 */

import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '../../../db/maindb';
import { queries } from './queries.settings';
import { AppSetting, SettingsCache, Environment, SettingsError } from './types.settings';
import { createSystemLogger, Logger, OperationType } from '../../../core/logger/logger.index';
import { Events } from '../../../core/logger/codes';

// Type assertion for pool
const pool = pgPool as Pool;

// In-memory cache object
let settingsCache: SettingsCache = {};

// Create logger for settings service
const logger: Logger = createSystemLogger({
  module: 'SettingsService',
  fileName: 'service.load.settings.ts'
});

/**
 * Generate cache key from section_path and setting_name
 */
function generateCacheKey(sectionPath: string, settingName: string): string {
  return `${sectionPath}/${settingName}`;
}

/**
 * Load all settings from database into cache
 */
export async function loadSettings(): Promise<void> {
  try {
    logger.info({
      code: Events.CORE.SETTINGS.LOAD.START.INITIATED.code,
      message: 'Starting to load settings from database'
    });

    const result: QueryResult = await pool.query(queries.getAllSettings.text);
    
    if (!result.rows || result.rows.length === 0) {
      logger.warn({
        code: Events.CORE.SETTINGS.LOAD.PROCESS.EMPTY.code,
        message: 'No settings found in database'
      });
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

      const cacheKey = generateCacheKey(setting.section_path, setting.setting_name);
      settingsCache[cacheKey] = setting;
    });

    const settingsCount = Object.keys(settingsCache).length;
    
    logger.info({
      code: Events.CORE.SETTINGS.LOAD.PROCESS.SUCCESS.code,
      message: `Settings loaded successfully, number of loaded settings: ${settingsCount}`
    });

  } catch (error) {
    logger.error({
      code: Events.CORE.SETTINGS.LOAD.PROCESS.ERROR.code,
      message: 'Error loading settings',
      error,
      details: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    });
    
    const settingsError: SettingsError = {
      code: 'DB_ERROR',
      message: error instanceof Error ? error.message : 'Failed to load settings from database',
      details: error
    };
    throw settingsError;
  }
}

/**
 * Get setting by section path and name
 */
export function getSetting(sectionPath: string, settingName: string): AppSetting | null {
  const cacheKey = generateCacheKey(sectionPath, settingName);
  const setting = settingsCache[cacheKey];
  
  if (!setting) {
    logger.debug({
      code: Events.CORE.SETTINGS.GET.BY_NAME.NOT_FOUND.code,
      message: 'Setting not found in cache',
      details: { sectionPath, settingName }
    });
    return null;
  }

  return setting;
}

/**
 * Get setting value by section path and name
 * Returns parsed value or default value if setting not found
 */
export function getSettingValue(sectionPath: string, settingName: string): any {
  const setting = getSetting(sectionPath, settingName);
  
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
export function getSettingsBySection(sectionPath: string): AppSetting[] {
  const sectionSettings = Object.values(settingsCache).filter(
    setting => setting.section_path.startsWith(sectionPath)
  );
  
  if (sectionSettings.length === 0) {
    logger.debug({
      code: Events.CORE.SETTINGS.GET.BY_SECTION.NOT_FOUND.code,
      message: 'No settings found for section',
      details: { sectionPath }
    });
  } else {
    logger.debug({
      code: Events.CORE.SETTINGS.GET.BY_SECTION.SUCCESS.code,
      message: 'Settings section fetched successfully',
      details: { 
        sectionPath,
        settingsCount: sectionSettings.length
      }
    });
  }
  
  return sectionSettings;
}

/**
 * Force reload all settings from database
 */
export async function reloadSettings(): Promise<void> {
  logger.info({
    code: Events.CORE.SETTINGS.LOAD.START.INITIATED.code,
    message: 'Force reloading settings from database'
  });
  await loadSettings();
}

/**
 * Initialize settings module
 * This should be called when the server starts
 */
export async function initializeSettings(): Promise<void> {
  try {
    logger.info({
      code: Events.CORE.SETTINGS.INIT.PROCESS.START.code,
      message: 'Initializing settings module'
    });
    
    await loadSettings();
    
    logger.info({
      code: Events.CORE.SETTINGS.INIT.PROCESS.SUCCESS.code,
      message: 'Settings module initialized successfully'
    });
  } catch (error) {
    logger.error({
      code: Events.CORE.SETTINGS.INIT.PROCESS.ERROR.code,
      message: 'Failed to initialize settings module',
      error,
      details: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    });
    throw error;
  }
}