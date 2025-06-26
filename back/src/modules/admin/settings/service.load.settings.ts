/**
 * service.load.settings.ts - backend file
 * version: 1.0.03
 * Service for loading and caching application settings.
 * Uses simple console.log instead of lgr.
 */

import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '../../../core/db/maindb';
import { queries } from './queries.settings';
import { AppSetting, Environment, SettingsError } from './types.settings';
import { setCache, clearCache } from './cache.settings';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Load all settings from database into cache
 */
export async function loadSettings(): Promise<void> {
  try {
    const result: QueryResult = await pool.query(queries.getAllSettings.text);
    
    if (!result.rows || result.rows.length === 0) {
      clearCache();
      console.warn('[Settings] No settings found in database');
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
    
    console.log(`[Settings] Loaded ${settings.length} settings from database`);
    console.log('[Settings] System settings are ready for use');

  } catch (error) {
    console.error('[Settings] Error loading settings:', error);
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
  console.log('[Settings] Force reloading settings from database');
  await loadSettings();
}

/**
 * Initialize settings module
 * This should be called when the server starts
 */
export async function initializeSettings(): Promise<void> {
  try {
    console.log('[Settings] Initializing settings module');
    await loadSettings();
    console.log('[Settings] Settings module initialized successfully');
  } catch (error) {
    console.error('[Settings] Failed to initialize settings module:', error);
    throw error;
  }
}