/**
 * service.load.settings.ts
 * Service for loading and caching application settings.
 */

import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '../../../db/maindb';
import { queries } from './queries.settings';
import { AppSetting, Environment, SettingsError } from './types.settings';
import { createSystemLgr, Lgr } from '../../../core/lgr/lgr.index';
import { Events } from '../../../core/lgr/codes';
import { setCache, clearCache } from './cache.settings';

// Type assertion for pool
const pool = pgPool as Pool;

// Create lgr for settings service
const lgr: Lgr = createSystemLgr({
  module: 'SettingsService',
  fileName: 'service.load.settings.ts'
});

/**
 * Load all settings from database into cache
 */
export async function loadSettings(): Promise<void> {
  try {
    lgr.info({
      code: Events.CORE.SETTINGS.LOAD.START.INITIATED.code,
      message: 'Starting to load settings from database'
    });

    const result: QueryResult = await pool.query(queries.getAllSettings.text);
    
    if (!result.rows || result.rows.length === 0) {
      lgr.warn({
        code: Events.CORE.SETTINGS.LOAD.PROCESS.EMPTY.code,
        message: 'No settings found in database'
      });
      // Clear cache if no settings
      clearCache();
      return;
    }

    // Transform query results into AppSetting objects
    const settings = result.rows.map(row => {
      return {
        ...row,
        value: row.value, // JSONB field, already parsed by pg
        validation_schema: row.validation_schema, // JSONB field
        default_value: row.default_value, // JSONB field
        updated_at: new Date(row.updated_at)
      } as AppSetting;
    });

    // Update the centralized cache
    setCache(settings);
    
    lgr.info({
      code: Events.CORE.SETTINGS.LOAD.PROCESS.SUCCESS.code,
      message: `Settings loaded successfully, number of loaded settings: ${settings.length}`
    });

  } catch (error) {
    lgr.error({
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
 * Force reload all settings from database
 */
export async function reloadSettings(): Promise<void> {
  lgr.info({
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
    lgr.info({
      code: Events.CORE.SETTINGS.INIT.PROCESS.START.code,
      message: 'Initializing settings module'
    });
    
    await loadSettings();
    
    lgr.info({
      code: Events.CORE.SETTINGS.INIT.PROCESS.SUCCESS.code,
      message: 'Settings module initialized successfully'
    });
  } catch (error) {
    lgr.error({
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