/**
 * controller.fetch.settings.ts - backend file
 * version: 1.0.03
 * Controller for handling settings fetch API requests.
 * Now uses universal connection handler for standardized HTTP processing.
 */

import { Request, Response } from 'express';
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
import { connectionHandler } from '../../../core/helpers/connection.handler';



// Extended Request interface to include user property added by auth middleware
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username?: string;
    [key: string]: any;
  }
}



/**
 * Business logic for fetching settings
 * @param req Express request
 * @param res Express response
 */
async function fetchSettingsLogic(req: AuthenticatedRequest, res: Response): Promise<FetchSettingsResponse> {
  const userId = req.user?.id;
  let username = req.user?.username || null;
  const requestorUuid = getRequestorUuidFromReq(req);

  // ВРЕМЕННО: Отключаем проверку административных прав
  // const isAdmin = userId ? await isUserAdmin(userId) : false;
  const isAdmin = true; // Временное решение для отладки

  const { type, ...params } = req.body;

  // Validate request
  if (!type) {
    throw new Error('Missing required parameter: type');
  }

  // Set defaults
  // Only administrators can access confidential settings
  const includeConfidential = isAdmin && params.includeConfidential === true;
  const isPublicOnly = params.isPublicOnly;
  
  if (params.includeConfidential && !isAdmin) {
    throw new Error('User attempted to access confidential settings without administrator privileges');
  }

  let environment = params.environment;

  // Validate environment if provided
  if (environment && !Object.values(Environment).includes(environment)) {
    throw new Error(`Invalid environment value: ${environment}. Valid values are: ${Object.values(Environment).join(', ')}`);
  }

  // Process request based on type
  let result: FetchSettingsResponse;

  switch (type) {
    case 'byName': {
      // Validate required parameters
      if (!params.sectionPath || !params.settingName) {
        throw new Error('Missing required parameters: sectionPath and settingName are required for byName requests');
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
        throw new Error('Missing required parameter: sectionPath is required for bySection requests');
      }

      const request: FetchSettingsBySectionRequest = {
        sectionPath: params.sectionPath,
        environment,
        includeConfidential,
        isPublicOnly
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
        includeConfidential,
        isPublicOnly
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
      throw new Error(`Invalid fetch type: ${type}. Valid types are: byName, bySection, all`);
    }
  }

  return result;
}

// Export controller using universal connection handler
export default connectionHandler(fetchSettingsLogic, 'FetchSettingsController');
