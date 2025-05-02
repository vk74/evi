/**
 * service.update.settings.ts - version 1.0.01
 * Service for updating application settings.
 * Validates new setting values against schemas and updates both database and cache.
 * Now accepts request object for access to user context.
 */

import { Request } from 'express';
import { Pool, QueryResult, PoolClient } from 'pg';
import { pool as pgPool } from '../../../db/maindb';
import { queries } from './queries.settings';
import { AppSetting, Environment, SettingsError, UpdateSettingRequest, UpdateSettingResponse } from './types.settings';
import { createSystemLgr, Lgr } from '../../../core/lgr/lgr.index';
import { Events } from '../../../core/lgr/codes';
import { getSetting, hasSetting, updateCachedSetting } from './cache.settings';
import { validateOrThrow } from './service.validate.settings';
import { getRequestorUuidFromReq } from '../../../core/helpers/get.requestor.uuid.from.req';

// Type assertion for pool
const pool = pgPool as Pool;

// Create lgr for settings service
const lgr: Lgr = createSystemLgr({
  module: 'SettingsUpdateService',
  fileName: 'service.update.settings.ts'
});

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
    
    // Log update request
    lgr.info({
      code: Events.CORE.SETTINGS.UPDATE.START.INITIATED.code,
      message: 'Setting update requested',
      details: {
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
      lgr.debug({
        code: Events.CORE.SETTINGS.UPDATE.PROCESS.CACHE_MISS.code,
        message: 'Setting not found in cache, attempting to fetch from database',
        details: { 
          sectionPath, 
          settingName,
          requestorUuid
        }
      });

      // Query database for this setting
      const result = await pool.query(queries.getSettingByPath.text, [sectionPath, settingName]);
      
      if (!result.rows || result.rows.length === 0) {
        const errorMessage = `Setting not found: ${sectionPath}/${settingName}`;
        lgr.error({
          code: Events.CORE.SETTINGS.UPDATE.PROCESS.ERROR.code,
          message: errorMessage,
          details: { 
            sectionPath, 
            settingName,
            requestorUuid
          }
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
      lgr.error({
        code: Events.CORE.SETTINGS.UPDATE.PROCESS.ERROR.code,
        message: errorMessage,
        details: { 
          sectionPath, 
          settingName,
          requestorUuid
        }
      });
      
      return {
        success: false,
        error: errorMessage
      };
    }

    // Validate setting value against schema
    validateOrThrow(setting, value);

    // Start transaction for atomic update
    client = await pool.connect();
    await client.query('BEGIN');

    // Update database
    const updateResult = await client.query(
      queries.updateSettingValue.text,
      [sectionPath, settingName, value]
    );

    if (!updateResult.rows || updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      
      const errorMessage = `Failed to update setting: ${sectionPath}/${settingName}`;
      lgr.error({
        code: Events.CORE.SETTINGS.UPDATE.PROCESS.ERROR.code,
        message: errorMessage,
        details: { 
          sectionPath, 
          settingName,
          requestorUuid
        }
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
    
    lgr.info({
      code: Events.CORE.SETTINGS.UPDATE.PROCESS.SUCCESS.code,
      message: 'Setting updated successfully',
      details: {
        sectionPath,
        settingName,
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
        
        lgr.error({
          code: Events.CORE.SETTINGS.UPDATE.PROCESS.ERROR.code,
          message: 'Error during transaction rollback',
          error: err,
          details: {
            originalError: error instanceof Error ? error.message : 'Unknown error',
            requestorUuid
          }
        });
      });
    }

    // Log error with details
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Получаем UUID пользователя из запроса для логирования
    const requestorUuid = getRequestorUuidFromReq(req);
    
    lgr.error({
      code: Events.CORE.SETTINGS.UPDATE.PROCESS.ERROR.code,
      message: 'Error updating setting',
      error,
      details: {
        sectionPath,
        settingName,
        errorMessage,
        requestorUuid
      }
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