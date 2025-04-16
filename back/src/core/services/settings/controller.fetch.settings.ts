/**
 * controller.fetch.settings.ts
 * Controller for handling settings fetch API requests.
 */

import { Request, Response } from 'express';
import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '../../../db/maindb';
import { 
  AppSetting, 
  Environment,
  FetchSettingsResponse,
  FetchSettingByNameRequest,
  FetchSettingsBySectionRequest,
  FetchAllSettingsRequest
} from './types.settings';
import {
  fetchSettingByName,
  fetchSettingsBySection,
  fetchAllSettings
} from './service.fetch.settings';
import { createSystemLogger, Logger } from '../../../core/logger/logger.index';
import { Events } from '../../../core/logger/codes';

// Get the pool from maindb
const pool = pgPool as Pool;

// Extended Request interface to include user property added by auth middleware
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username?: string;
    [key: string]: any;
  }
}

// Create logger for settings controller
const logger: Logger = createSystemLogger({
  module: 'SettingsController',
  fileName: 'controller.fetch.settings.ts'
});

/**
 * Check if the user is a member of the administrators group
 * @param userId User ID to check
 * @returns Promise resolving to boolean indicating if user is an administrator
 */
async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    // First query - find the UUID of the administrators group
    const groupQuery: QueryResult = await pool.query(
      `SELECT group_id 
       FROM app.groups 
       WHERE group_name = $1 
       LIMIT 1`,
      ['administrators']
    );

    // If group not found, user is not an admin
    if (!groupQuery.rows || groupQuery.rows.length === 0) {
      logger.warn({
        code: Events.CORE.SETTINGS.API.FETCH.VALIDATION_ERROR.code,
        message: 'Administrators group not found in the system',
        details: { userId }
      });
      return false;
    }
    
    const adminGroupId = groupQuery.rows[0].group_id;
    
    // Second query - check if the user is a member of the found group
    const memberQuery: QueryResult = await pool.query(
      `SELECT 1 
       FROM app.group_members 
       WHERE user_id = $1 
       AND group_id = $2
       AND is_active = true
       LIMIT 1`,
      [userId, adminGroupId]
    );

    // Безопасная проверка на существование строк в результате
    return memberQuery.rowCount !== null && memberQuery.rowCount > 0;
  } catch (error) {
    logger.error({
      code: Events.CORE.SETTINGS.API.FETCH.ERROR.code,
      message: 'Error checking administrator status',
      error,
      details: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        userId
      }
    });
    return false;
  }
}

/**
 * Get username by user UUID
 * @param userId User UUID
 * @returns Username or null if not found
 */
async function getUsernameByUuid(userId: string): Promise<string | null> {
  try {
    const result: QueryResult<{ username: string }> = await pool.query(
      'SELECT username FROM app.users WHERE user_id = $1 LIMIT 1',
      [userId]
    );

    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    return result.rows[0].username;
  } catch (error) {
    logger.error({
      code: Events.CORE.SETTINGS.API.FETCH.ERROR.code,
      message: 'Error fetching username by UUID',
      error,
      details: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        userId
      }
    });
    return null;
  }
}

/**
 * Handle fetch settings API request
 * @param req Express request
 * @param res Express response
 */
async function fetchSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    let username = req.user?.username || null;

    // If username is not available in req.user, fetch it
    if (userId && !username) {
      username = await getUsernameByUuid(userId);
    }

    // Check if user is an administrator
    const isAdmin = userId ? await isUserAdmin(userId) : false;

    logger.info({
      code: Events.CORE.SETTINGS.API.FETCH.RECEIVED.code,
      message: 'Received settings fetch request',
      details: { 
        body: req.body,
        userId,
        username,
        isAdmin
      }
    });

    const { type, ...params } = req.body;

    // Validate request
    if (!type) {
      logger.warn({
        code: Events.CORE.SETTINGS.API.FETCH.VALIDATION_ERROR.code,
        message: 'Missing required parameter: type',
        details: { 
          body: req.body,
          userId,
          username
        }
      });

      res.status(400).json({
        success: false,
        error: 'Missing required parameter: type'
      } as FetchSettingsResponse);
      return;
    }

    // Set defaults
    // Only administrators can access confidential settings
    const includeConfidential = isAdmin && params.includeConfidential === true;
    
    if (params.includeConfidential && !isAdmin) {
      logger.warn({
        code: Events.CORE.SETTINGS.API.FETCH.VALIDATION_ERROR.code,
        message: 'User attempted to access confidential settings without administrator privileges',
        details: { 
          userId,
          username,
          isAdmin: false
        }
      });
    }

    let environment = params.environment;

    // Validate environment if provided
    if (environment && !Object.values(Environment).includes(environment)) {
      logger.warn({
        code: Events.CORE.SETTINGS.API.FETCH.VALIDATION_ERROR.code,
        message: 'Invalid environment value',
        details: { 
          environment,
          userId,
          username 
        }
      });

      res.status(400).json({
        success: false,
        error: `Invalid environment value: ${environment}. Valid values are: ${Object.values(Environment).join(', ')}`
      } as FetchSettingsResponse);
      return;
    }

    // Process request based on type
    let result: FetchSettingsResponse;

    switch (type) {
      case 'byName': {
        // Validate required parameters
        if (!params.sectionPath || !params.settingName) {
          logger.warn({
            code: Events.CORE.SETTINGS.API.FETCH.VALIDATION_ERROR.code,
            message: 'Missing required parameters for byName request',
            details: { 
              params,
              userId,
              username
            }
          });

          res.status(400).json({
            success: false,
            error: 'Missing required parameters: sectionPath and settingName are required for byName requests'
          } as FetchSettingsResponse);
          return;
        }

        const request: FetchSettingByNameRequest = {
          sectionPath: params.sectionPath,
          settingName: params.settingName,
          environment,
          includeConfidential
        };

        const setting = await fetchSettingByName(request);

        result = {
          success: true,
          setting: setting || undefined,
        };
        break;
      }

      case 'bySection': {
        // Validate required parameters
        if (!params.sectionPath) {
          logger.warn({
            code: Events.CORE.SETTINGS.API.FETCH.VALIDATION_ERROR.code,
            message: 'Missing required parameter for bySection request',
            details: { 
              params,
              userId,
              username
            }
          });

          res.status(400).json({
            success: false,
            error: 'Missing required parameter: sectionPath is required for bySection requests'
          } as FetchSettingsResponse);
          return;
        }

        const request: FetchSettingsBySectionRequest = {
          sectionPath: params.sectionPath,
          environment,
          includeConfidential
        };

        const settings = await fetchSettingsBySection(request);

        result = {
          success: true,
          settings
        };
        break;
      }

      case 'all': {
        const request: FetchAllSettingsRequest = {
          environment,
          includeConfidential
        };

        const settings = await fetchAllSettings(request);

        result = {
          success: true,
          settings
        };
        break;
      }

      default: {
        logger.warn({
          code: Events.CORE.SETTINGS.API.FETCH.VALIDATION_ERROR.code,
          message: 'Invalid fetch type',
          details: { 
            type,
            userId,
            username
          }
        });

        res.status(400).json({
          success: false,
          error: `Invalid fetch type: ${type}. Valid types are: byName, bySection, all`
        } as FetchSettingsResponse);
        return;
      }
    }

    logger.info({
      code: Events.CORE.SETTINGS.API.FETCH.SUCCESS.code,
      message: 'Settings fetch request processed successfully',
      details: {
        type,
        settingsCount: result.settings?.length || (result.setting ? 1 : 0),
        confidentialIncluded: includeConfidential,
        userId,
        username,
        requestedEnvironment: environment
      }
    });

    res.status(200).json(result);
  } catch (error) {
    logger.error({
      code: Events.CORE.SETTINGS.API.FETCH.ERROR.code,
      message: 'Error processing settings fetch request',
      error,
      details: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        body: req.body,
        userId: req.user?.id
      }
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error while processing settings fetch request'
    } as FetchSettingsResponse);
  }
}

export default fetchSettings;
