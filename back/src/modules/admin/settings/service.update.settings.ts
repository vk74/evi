/**
 * service.update.settings.ts - backend file
 * version: 1.0.03
 * Service for updating application settings.
 * Validates new setting values against schemas and updates both database and cache.
 * Now uses event system instead of logging.
 */

import { Request } from 'express';
import { Pool, QueryResult, PoolClient } from 'pg';
import { pool as pgPool } from '../../../core/db/maindb';
import { queries } from './queries.settings';
import { AppSetting, Environment, SettingsError, UpdateSettingRequest, UpdateSettingResponse } from './types.settings';
import { getSetting, hasSetting, updateCachedSetting } from './cache.settings';
import { validateOrThrow } from './service.validate.settings';
import { getRequestorUuidFromReq } from '../../../core/helpers/get.requestor.uuid.from.req';
import fabricEvents from '../../../core/eventBus/fabric.events';
import { SETTINGS_UPDATE_EVENTS } from './events.settings';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Updates a setting value in both database and cache
 * 
 * @param request - Update setting request containing sectionPath, settingName and new value
 * @param req - Express request object for user context
 * @returns Promise resolving to UpdateSettingResponse
 */
export async function updateSetting(request: UpdateSettingRequest, req: Request): Promise<UpdateSettingResponse> {
  const { sectionPath, settingName, value, environment } = request;
  let client: PoolClient | null = null;

  try {
    // Получаем UUID пользователя из запроса
    const requestorUuid = getRequestorUuidFromReq(req);
    
    // Publish update initiated event
    fabricEvents.createAndPublishEvent({
      eventName: SETTINGS_UPDATE_EVENTS.REQUEST_INITIATED.eventName,
      req,
      payload: {
        sectionPath,
        settingName,
        environment: environment || 'all',
        requestorUuid
      }
    });

    // Get setting from cache first to validate
    let setting = getSetting(sectionPath, settingName);

    // If not in cache, we need to fetch it from database
    if (!setting) {
      // Publish cache miss event
      fabricEvents.createAndPublishEvent({
        eventName: SETTINGS_UPDATE_EVENTS.VALIDATION_FAILED.eventName,
        req,
        payload: { 
          message: 'Setting not found in cache, attempting to fetch from database',
          sectionPath, 
          settingName,
          requestorUuid
        }
      });

      // Query database for this setting
      const result = await pool.query(queries.getSettingByPath.text, [sectionPath, settingName]);
      
      if (!result.rows || result.rows.length === 0) {
        const errorMessage = `Setting not found: ${sectionPath}/${settingName}`;
        
        // Publish error event
        fabricEvents.createAndPublishEvent({
          eventName: SETTINGS_UPDATE_EVENTS.ERROR.eventName,
          req,
          payload: { 
            message: errorMessage,
            sectionPath, 
            settingName,
            requestorUuid
          },
          errorData: errorMessage
        });
        
        return {
          success: false,
          error: errorMessage
        };
      }
      
      // Parse setting from database
      setting = {
        ...result.rows[0],
        value: result.rows[0].value,
        validation_schema: result.rows[0].validation_schema,
        default_value: result.rows[0].default_value,
        updated_at: new Date(result.rows[0].updated_at)
      };
    }

    // At this point, setting should always be defined
    // But let's add an additional check to satisfy TypeScript
    if (!setting) {
      const errorMessage = `Unable to retrieve setting: ${sectionPath}/${settingName}`;
      
      // Publish error event
      fabricEvents.createAndPublishEvent({
        eventName: SETTINGS_UPDATE_EVENTS.ERROR.eventName,
        req,
        payload: { 
          message: errorMessage,
          sectionPath, 
          settingName,
          requestorUuid
        },
        errorData: errorMessage
      });
      
      return {
        success: false,
        error: errorMessage
      };
    }

    try {
      // Validate setting value against schema
      validateOrThrow(setting, value);
      
      // Publish validation passed event
      fabricEvents.createAndPublishEvent({
        eventName: SETTINGS_UPDATE_EVENTS.VALIDATION_PASSED.eventName,
        req,
        payload: {
          sectionPath,
          settingName,
          requestorUuid
        }
      });
    } catch (validationError) {
      // Publish validation failed event
      fabricEvents.createAndPublishEvent({
        eventName: SETTINGS_UPDATE_EVENTS.VALIDATION_FAILED.eventName,
        req,
        payload: {
          sectionPath,
          settingName,
          error: validationError instanceof Error ? validationError.message : 'Validation error',
          requestorUuid
        },
        errorData: validationError instanceof Error ? validationError.message : 'Validation error'
      });
      
      throw validationError;
    }

    // Start transaction for atomic update
    client = await pool.connect();
    await client.query('BEGIN');

    // Convert value to JSON string for JSONB column
    const jsonValue = JSON.stringify(value);

    // Publish database update started event
    fabricEvents.createAndPublishEvent({
      eventName: SETTINGS_UPDATE_EVENTS.DATABASE_UPDATE_STARTED.eventName,
      req,
      payload: {
        sectionPath,
        settingName,
        valueType: typeof value,
        value,
        jsonValue,
        sqlQuery: queries.updateSettingValue.text,
        sqlParams: [sectionPath, settingName, jsonValue],
        requestorUuid
      }
    });
    
    const updateResult = await client.query(
      queries.updateSettingValue.text,
      [sectionPath, settingName, jsonValue]
    );

    if (!updateResult.rows || updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      
      const errorMessage = `Failed to update setting: ${sectionPath}/${settingName}`;
      
      // Publish error event
      fabricEvents.createAndPublishEvent({
        eventName: SETTINGS_UPDATE_EVENTS.ERROR.eventName,
        req,
        payload: { 
          message: errorMessage,
          sectionPath, 
          settingName,
          requestorUuid
        },
        errorData: errorMessage
      });
      
      return {
        success: false,
        error: errorMessage
      };
    }

    // Update successful, commit transaction
    await client.query('COMMIT');

    // Parse updated setting
    const updatedSetting: AppSetting = {
      ...updateResult.rows[0],
      value: updateResult.rows[0].value,
      validation_schema: updateResult.rows[0].validation_schema,
      default_value: updateResult.rows[0].default_value,
      updated_at: new Date(updateResult.rows[0].updated_at)
    };

    // Update cache
    updateCachedSetting(updatedSetting);
    
    // Publish success event with old and new values
    fabricEvents.createAndPublishEvent({
      eventName: SETTINGS_UPDATE_EVENTS.SUCCESS.eventName,
      req,
      payload: {
        sectionPath,
        settingName,
        oldValue: setting.value,
        newValue: value,
        updatedAt: updatedSetting.updated_at,
        requestorUuid
      }
    });

    return {
      success: true,
      updatedSetting
    };
  } catch (error) {
    // Rollback transaction if active
    if (client) {
      await client.query('ROLLBACK').catch(err => {
        // Получаем UUID пользователя из запроса для логирования
        const requestorUuid = getRequestorUuidFromReq(req);
        
        // Publish error event for rollback failure
        fabricEvents.createAndPublishEvent({
          eventName: SETTINGS_UPDATE_EVENTS.ERROR.eventName,
          req,
          payload: {
            message: 'Error during transaction rollback',
            originalError: error instanceof Error ? error.message : 'Unknown error',
            rollbackError: err instanceof Error ? err.message : 'Unknown rollback error',
            requestorUuid
          },
          errorData: err instanceof Error ? err.message : 'Unknown rollback error'
        });
      });
    }

    // Get error details
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const requestorUuid = getRequestorUuidFromReq(req);
    
    // Publish error event
    fabricEvents.createAndPublishEvent({
      eventName: SETTINGS_UPDATE_EVENTS.ERROR.eventName,
      req,
      payload: {
        message: 'Error updating setting',
        sectionPath,
        settingName,
        errorDetails: errorMessage,
        requestorUuid
      },
      errorData: errorMessage
    });

    // Determine error type
    const settingsError: SettingsError = error instanceof Error && 'code' in error 
      ? error as SettingsError
      : {
          code: 'DB_ERROR',
          message: errorMessage,
          details: error
        };

    return {
      success: false,
      error: settingsError.message
    };
  } finally {
    // Release client back to pool
    if (client) {
      client.release();
    }
  }
}

/**
 * Handle update settings request with business logic
 * Contains all validation, logging, and request processing logic
 * @param req Express request object
 * @returns Promise resolving to update settings response
 */
export async function handleUpdateSettingsRequest(req: Request): Promise<UpdateSettingResponse> {
  // Получаем UUID пользователя, делающего запрос
  const requestorUuid = getRequestorUuidFromReq(req);

  // Validate required fields in request
  const { sectionPath, settingName, value } = req.body;

  if (!sectionPath || !settingName || value === undefined) {
    throw new Error('Invalid request. sectionPath, settingName, and value are required.');
  }

  // Prepare request for service
  const updateRequest: UpdateSettingRequest = {
    sectionPath,
    settingName,
    value,
    environment: req.body.environment
  };

  // Call service to process update
  const result = await updateSetting(updateRequest, req);

  return result;
}