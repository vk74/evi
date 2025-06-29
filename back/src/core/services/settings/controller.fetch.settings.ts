/**
 * controller.fetch.settings.ts - backend file
 * version: 1.0.02
 * Controller for handling settings fetch API requests.
 * Now uses event system instead of logging.
 */

import { Request, Response } from 'express';
import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '../../db/maindb';
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
import { getRequestorUuidFromReq } from '../../../core/helpers/get.requestor.uuid.from.req';
import fabricEvents from '../../../core/eventBus/fabric.events';
import { SETTINGS_FETCH_CONTROLLER_EVENTS } from './events.settings';

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

/**
 * Check if the user is a member of the administrators group
 * @param userId User ID (can be username or UUID)
 * @returns Promise resolving to boolean indicating if user is an administrator
 */
async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    // Check if userId is a UUID or a username
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    
    // Get user_id (UUID) if we received a username
    let userUuid = userId;
    if (!isUuid) {
      try {
        const userResult: QueryResult = await pool.query(
          'SELECT user_id FROM app.users WHERE username = $1 LIMIT 1',
          [userId]
        );
        
        if (!userResult.rows || userResult.rows.length === 0) {
          fabricEvents.createAndPublishEvent({
            eventName: SETTINGS_FETCH_CONTROLLER_EVENTS.VALIDATION_ERROR.eventName,
            payload: {
              message: 'User not found',
              details: { userId }
            }
          });
          return false;
        }
        
        userUuid = userResult.rows[0].user_id;
      } catch (error) {
        fabricEvents.createAndPublishEvent({
          eventName: SETTINGS_FETCH_CONTROLLER_EVENTS.HTTP_ERROR.eventName,
          payload: {
            message: 'Error getting user UUID by username',
            errorDetails: error instanceof Error ? error.message : 'Unknown error',
            userId
          },
          errorData: error instanceof Error ? error.message : 'Unknown error'
        });
        return false;
      }
    }

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
      fabricEvents.createAndPublishEvent({
        eventName: SETTINGS_FETCH_CONTROLLER_EVENTS.VALIDATION_ERROR.eventName,
        payload: {
          message: 'Administrators group not found in the system',
          details: { userId, userUuid }
        }
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
      [userUuid, adminGroupId]
    );

    // Безопасная проверка на существование строк в результате
    return memberQuery.rowCount !== null && memberQuery.rowCount > 0;
  } catch (error) {
    fabricEvents.createAndPublishEvent({
      eventName: SETTINGS_FETCH_CONTROLLER_EVENTS.HTTP_ERROR.eventName,
      payload: {
        message: 'Error checking administrator status',
        errorDetails: error instanceof Error ? error.message : 'Unknown error',
        userId
      },
      errorData: error instanceof Error ? error.message : 'Unknown error'
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
    fabricEvents.createAndPublishEvent({
      eventName: SETTINGS_FETCH_CONTROLLER_EVENTS.HTTP_ERROR.eventName,
      payload: {
        message: 'Error fetching username by UUID',
        errorDetails: error instanceof Error ? error.message : 'Unknown error',
        userId
      },
      errorData: error instanceof Error ? error.message : 'Unknown error'
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
    const requestorUuid = getRequestorUuidFromReq(req);

    // ВРЕМЕННО: Отключаем проверку административных прав
    // const isAdmin = userId ? await isUserAdmin(userId) : false;
    const isAdmin = true; // Временное решение для отладки

    // Publish event for received request
    fabricEvents.createAndPublishEvent({
      eventName: SETTINGS_FETCH_CONTROLLER_EVENTS.HTTP_REQUEST_RECEIVED.eventName,
      req,
      payload: { 
        body: req.body,
        userId,
        username,
        isAdmin,
        requestorUuid,
        method: req.method,
        url: req.url
      }
    });

    const { type, ...params } = req.body;

    // Validate request
    if (!type) {
      fabricEvents.createAndPublishEvent({
        eventName: SETTINGS_FETCH_CONTROLLER_EVENTS.VALIDATION_ERROR.eventName,
        req,
        payload: { 
          message: 'Missing required parameter: type',
          body: req.body,
          userId,
          username,
          requestorUuid
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
      fabricEvents.createAndPublishEvent({
        eventName: SETTINGS_FETCH_CONTROLLER_EVENTS.VALIDATION_ERROR.eventName,
        req,
        payload: { 
          message: 'User attempted to access confidential settings without administrator privileges',
          userId,
          username,
          isAdmin: false,
          requestorUuid
        }
      });
    }

    let environment = params.environment;

    // Validate environment if provided
    if (environment && !Object.values(Environment).includes(environment)) {
      fabricEvents.createAndPublishEvent({
        eventName: SETTINGS_FETCH_CONTROLLER_EVENTS.VALIDATION_ERROR.eventName,
        req,
        payload: { 
          message: 'Invalid environment value',
          environment,
          userId,
          username,
          requestorUuid
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
          fabricEvents.createAndPublishEvent({
            eventName: SETTINGS_FETCH_CONTROLLER_EVENTS.VALIDATION_ERROR.eventName,
            req,
            payload: { 
              message: 'Missing required parameters for byName request',
              params,
              userId,
              username,
              requestorUuid
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

        // Передаём объект запроса в сервис
        const setting = await fetchSettingByName(request, req);

        result = {
          success: true,
          setting: setting || undefined,
        };
        break;
      }

      case 'bySection': {
        // Validate required parameters
        if (!params.sectionPath) {
          fabricEvents.createAndPublishEvent({
            eventName: SETTINGS_FETCH_CONTROLLER_EVENTS.VALIDATION_ERROR.eventName,
            req,
            payload: { 
              message: 'Missing required parameter for bySection request',
              params,
              userId,
              username,
              requestorUuid
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

        // Передаём объект запроса в сервис
        const settings = await fetchSettingsBySection(request, req);

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

        // Передаём объект запроса в сервис
        const settings = await fetchAllSettings(request, req);

        result = {
          success: true,
          settings
        };
        break;
      }

      default: {
        fabricEvents.createAndPublishEvent({
          eventName: SETTINGS_FETCH_CONTROLLER_EVENTS.VALIDATION_ERROR.eventName,
          req,
          payload: { 
            message: 'Invalid fetch type',
            type,
            userId,
            username,
            requestorUuid
          }
        });

        res.status(400).json({
          success: false,
          error: `Invalid fetch type: ${type}. Valid types are: byName, bySection, all`
        } as FetchSettingsResponse);
        return;
      }
    }

    // Publish event for successful response
    fabricEvents.createAndPublishEvent({
      eventName: SETTINGS_FETCH_CONTROLLER_EVENTS.HTTP_RESPONSE_SENT.eventName,
      req,
      payload: {
        type,
        settingsCount: result.settings?.length || (result.setting ? 1 : 0),
        confidentialIncluded: includeConfidential,
        userId,
        username,
        requestorUuid,
        requestedEnvironment: environment,
        statusCode: 200
      }
    });

    res.status(200).json(result);
  } catch (error) {
    // Get UUID from request if possible
    const requestorUuid = getRequestorUuidFromReq(req);
    
    fabricEvents.createAndPublishEvent({
      eventName: SETTINGS_FETCH_CONTROLLER_EVENTS.HTTP_ERROR.eventName,
      req,
      payload: {
        message: 'Error processing settings fetch request',
        errorDetails: error instanceof Error ? error.message : 'Unknown error',
        body: req.body,
        userId: req.user?.id,
        requestorUuid,
        statusCode: 500
      },
      errorData: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error while processing settings fetch request'
    } as FetchSettingsResponse);
  }
}

export default fetchSettings;
