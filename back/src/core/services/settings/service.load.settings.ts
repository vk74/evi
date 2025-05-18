/**
 * service.load.settings.ts - backend file
 * version: 1.0.03
 * Service for loading and caching application settings.
 * Uses simple console.log instead of lgr.
 */

import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '../../db/maindb';
import { queries } from './queries.settings';
import { AppSetting, Environment, SettingsError } from './types.settings';
import { setCache, clearCache } from './cache.settings';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Helper function for consistent log format
 * @param level Log level (INFO, WARN, ERROR)
 * @param message Message to log
 * @param details Optional details to include
 */
function logMessage(level: string, message: string, details?: any): void {
  console.log(`[${new Date().toISOString()}] [${level}] [SettingsLoader] ${message}`, details || '');
}

/**
 * Load all settings from database into cache
 */
export async function loadSettings(): Promise<void> {
  try {
    logMessage('INFO', 'Starting to load settings from database');

    const result: QueryResult = await pool.query(queries.getAllSettings.text);
    
    if (!result.rows || result.rows.length === 0) {
      logMessage('WARN', 'No settings found in database');
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
    
    logMessage('INFO', `Settings loaded successfully, number of loaded settings: ${settings.length}`);

  } catch (error) {
    logMessage('ERROR', 'Error loading settings', {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
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
  logMessage('INFO', 'Force reloading settings from database');
  await loadSettings();
}

/**
 * Initialize settings module
 * This should be called when the server starts
 */
export async function initializeSettings(): Promise<void> {
  try {
    logMessage('INFO', 'Initializing settings module');
    
    await loadSettings();
    
    logMessage('INFO', 'Settings module initialized successfully');
  } catch (error) {
    logMessage('ERROR', 'Failed to initialize settings module', {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}