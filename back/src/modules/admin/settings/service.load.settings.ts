/**
 * service.load.settings.ts - backend file
 * version: 1.0.04
 * Service for loading and caching application settings.
 */

import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '../../../core/db/maindb';
import { queries } from './queries.settings';
import { AppSetting, Environment, SettingsError } from './types.settings';
import { setCache, clearCache } from './cache.settings';
import fabricEvents from '../../../core/eventBus/fabric.events';
import { SETTINGS_LOAD_EVENTS, SETTINGS_INITIALIZATION_EVENTS, SETTINGS_FALLBACK_EVENTS } from './events.settings';

/**
 * Safe event creation that handles cases when event system is not yet initialized
 */
function createEventSafely(eventName: string, payload?: any, errorData?: string): void {
  try {
    fabricEvents.createAndPublishEvent({
      eventName,
      payload,
      errorData
    });
  } catch (error) {
    // If event system is not ready, fall back to console logging
    const message = `[Settings] ${eventName}`;
    if (errorData) {
      console.error(message, payload || '', 'Error:', errorData);
      // Also try to publish fallback error event
      try {
        fabricEvents.createAndPublishEvent({
          eventName: SETTINGS_FALLBACK_EVENTS.LOAD_FALLBACK_ERROR.eventName,
          payload: {
            eventName,
            payload,
            errorData
          },
          errorData: errorData
        });
      } catch (fallbackError) {
        // If even fallback event fails, just log to console
        console.error('[Settings] Fallback event failed:', fallbackError);
      }
    } else if (payload) {
      console.log(message, payload);
      // Also try to publish fallback log event
      try {
        fabricEvents.createAndPublishEvent({
          eventName: SETTINGS_FALLBACK_EVENTS.LOAD_FALLBACK_LOG.eventName,
          payload: {
            eventName,
            payload
          }
        });
      } catch (fallbackError) {
        // If even fallback event fails, just log to console
        console.error('[Settings] Fallback event failed:', fallbackError);
      }
    } else {
      console.log(message);
      // Also try to publish fallback log event
      try {
        fabricEvents.createAndPublishEvent({
          eventName: SETTINGS_FALLBACK_EVENTS.LOAD_FALLBACK_LOG.eventName,
          payload: {
            eventName
          }
        });
      } catch (fallbackError) {
        // If even fallback event fails, just log to console
        console.error('[Settings] Fallback event failed:', fallbackError);
      }
    }
  }
}

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Load all settings from database into cache
 */
export async function loadSettings(): Promise<void> {
  createEventSafely(SETTINGS_LOAD_EVENTS.STARTED.eventName, {
    operation: 'loadSettings'
  });
  
  try {
    const result: QueryResult = await pool.query(queries.getAllSettings.text);
    
    if (!result.rows || result.rows.length === 0) {
      clearCache();
      createEventSafely(SETTINGS_LOAD_EVENTS.NO_SETTINGS_FOUND.eventName, null);
      return;
    }

    // Transform query results into AppSetting objects
    const settings = result.rows.map(row => {
      return {
        ...row,
        value: row.value, // JSONB field, already parsed by pg
        validation_schema: row.validation_schema, // JSONB field
        default_value: row.default_value, // JSONB field
        is_public: row.is_public, // Boolean field for public filtering
        updated_at: new Date(row.updated_at)
      } as AppSetting;
    });



    // Update the centralized cache
    setCache(settings);
    
    createEventSafely(SETTINGS_LOAD_EVENTS.SUCCESS.eventName, {
      settingsCount: settings.length
    });
    
    createEventSafely(SETTINGS_INITIALIZATION_EVENTS.READY.eventName, null);

  } catch (error) {
    createEventSafely(
      SETTINGS_LOAD_EVENTS.ERROR.eventName, 
      { operation: 'loadSettings' },
      error instanceof Error ? error.message : String(error)
    );
    
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
  createEventSafely(SETTINGS_LOAD_EVENTS.FORCE_RELOAD_STARTED.eventName, null);
  
  await loadSettings();
}

/**
 * Initialize settings module
 * This should be called when the server starts
 */
export async function initializeSettings(): Promise<void> {
  try {
    createEventSafely(SETTINGS_INITIALIZATION_EVENTS.STARTED.eventName, null);
    
    await loadSettings();
    
    createEventSafely(SETTINGS_INITIALIZATION_EVENTS.SUCCESS.eventName, null);
  } catch (error) {
    createEventSafely(
      SETTINGS_INITIALIZATION_EVENTS.ERROR.eventName, 
      null,
      error instanceof Error ? error.message : String(error)
    );
    
    throw error;
  }
}