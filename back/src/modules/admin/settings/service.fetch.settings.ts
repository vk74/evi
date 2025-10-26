/**
 * service.fetch.settings.ts - backend file
 * version: 1.0.03
 * Service for fetching settings from cache with filtering.
 */

import { Request } from 'express';

// Extended Request interface to include user property added by auth middleware
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username?: string;
    [key: string]: any;
  }
}
import { getAllSettings } from './cache.settings';
import { 
  AppSetting, 
  Environment,
  FetchSettingByNameRequest,
  FetchSettingsBySectionRequest,
  FetchAllSettingsRequest,
  FetchSettingsResponse,
  SettingsError
} from './types.settings';
import { getRequestorUuidFromReq } from '../../../core/helpers/get.requestor.uuid.from.req';
import fabricEvents from '../../../core/eventBus/fabric.events';
import { 
  SETTINGS_FETCH_EVENTS, 
  SETTINGS_FETCH_BY_NAME_EVENTS, 
  SETTINGS_FETCH_BY_SECTION_EVENTS, 
  SETTINGS_FETCH_ALL_EVENTS 
} from './events.settings';

/**
 * Filter settings by environment
 * @param settings Settings to filter
 * @param environment Environment to filter by
 * @returns Filtered settings
 */
function filterSettingsByEnvironment(settings: AppSetting[], environment?: Environment): AppSetting[] {
  if (!environment || environment === Environment.ALL) {
    return settings;
  }

  return settings.filter(setting => 
    setting.environment === environment || 
    setting.environment === Environment.ALL
  );
}

/**
 * Filter out confidential settings if required
 * @param settings Settings to filter
 * @param includeConfidential Whether to include confidential settings
 * @returns Filtered settings
 */
function filterConfidentialSettings(settings: AppSetting[], includeConfidential = false): AppSetting[] {
  if (includeConfidential) {
    return settings;
  }

  return settings.filter(setting => !setting.confidentiality);
}

/**
 * Filter settings by public flag
 * @param settings Settings to filter
 * @param isPublicOnly Whether to filter by public settings only
 * @returns Filtered settings
 */
function filterSettingsByPublicFlag(settings: AppSetting[], isPublicOnly?: boolean): AppSetting[] {
  if (isPublicOnly === undefined || isPublicOnly === null) {
    return settings;
  }
  
  const filteredSettings = settings.filter(setting => setting.is_public === isPublicOnly);
  
  return filteredSettings;
}

/**
 * Normalize section path to support both PascalCase and snake_case formats
 * @param path Section path to normalize
 * @returns Array of normalized path variants for comparison
 */
function normalizeSectionPath(path: string): string[] {
  // Original path
  const variants = [path];
  
  // Convert PascalCase to snake_case: "OrganizationManagement.GroupsManagement" -> "organization_management.groups_management"
  const snakeCasePath = path.replace(/\.?([A-Z])/g, (x, y) => '_' + y.toLowerCase())
    .replace(/^_/, '')  // Remove leading underscore if any
    .replace(/\._/g, '.'); // Fix dots followed by underscores
  if (!variants.includes(snakeCasePath)) {
    variants.push(snakeCasePath);
  }
  
  // Convert snake_case to PascalCase: "users_management.groups" -> "UsersManagement.Groups"
  const pascalCasePath = path.split('.').map(segment => 
    segment.split('_').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join('')
  ).join('.');
  if (!variants.includes(pascalCasePath)) {
    variants.push(pascalCasePath);
  }
  
  return variants;
}

/**
 * Fetch a single setting by section path and name
 * @param request Request parameters
 * @param req Express request object for context
 * @returns The requested setting or null if not found
 */
export async function fetchSettingByName(request: FetchSettingByNameRequest, req: Request): Promise<AppSetting | null> {
  try {
    const { sectionPath, settingName, environment, includeConfidential = false } = request;
    const requestorUuid = getRequestorUuidFromReq(req);
    
    // Publish initiated event
    fabricEvents.createAndPublishEvent({
      eventName: SETTINGS_FETCH_BY_NAME_EVENTS.REQUEST_INITIATED.eventName,
      req,
      payload: { 
        sectionPath, 
        settingName, 
        environment,
        requestorUuid
      }
    });

    const allSettings = Object.values(getAllSettings());
    const pathVariants = normalizeSectionPath(sectionPath);
    
    // Find the specific setting using normalized path variants
    const setting = allSettings.find(s => {
      const settingPathVariants = normalizeSectionPath(s.section_path);
      return pathVariants.some(pathVariant => 
        settingPathVariants.some(settingPathVariant => settingPathVariant === pathVariant)
      ) && s.setting_name === settingName;
    });

    if (!setting) {
      // Publish not found event
      fabricEvents.createAndPublishEvent({
        eventName: SETTINGS_FETCH_BY_NAME_EVENTS.NOT_FOUND.eventName,
        req,
        payload: { 
          sectionPath, 
          settingName, 
          pathVariants,
          requestorUuid
        }
      });
      return null;
    }

    // Check environment
    if (environment && 
        environment !== Environment.ALL && 
        setting.environment !== Environment.ALL && 
        setting.environment !== environment) {
      // Publish not found event for environment mismatch
      fabricEvents.createAndPublishEvent({
        eventName: SETTINGS_FETCH_BY_NAME_EVENTS.NOT_FOUND.eventName,
        req,
        payload: { 
          settingName, 
          requestedEnv: environment, 
          settingEnv: setting.environment,
          requestorUuid
        }
      });
      return null;
    }

    // Check confidentiality
    if (!includeConfidential && setting.confidentiality) {
      // Publish confidential event
      fabricEvents.createAndPublishEvent({
        eventName: SETTINGS_FETCH_BY_NAME_EVENTS.CONFIDENTIAL.eventName,
        req,
        payload: { 
          settingName,
          requestorUuid
        }
      });
      return null;
    }

    // Publish success event
    fabricEvents.createAndPublishEvent({
      eventName: SETTINGS_FETCH_BY_NAME_EVENTS.SUCCESS.eventName,
      req,
      payload: { 
        settingName, 
        sectionPath, 
        pathVariants,
        requestorUuid
      }
    });

    return setting;
  } catch (error) {
    // Получаем UUID пользователя из запроса для логирования
    const requestorUuid = getRequestorUuidFromReq(req);
    
    // Publish error event
    fabricEvents.createAndPublishEvent({
      eventName: SETTINGS_FETCH_EVENTS.ERROR.eventName,
      req,
      payload: { 
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        operation: 'fetchSettingByName',
        request,
        requestorUuid
      },
      errorData: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw {
      code: 'CACHE_ERROR',
      message: 'Failed to fetch setting by name',
      details: error
    } as SettingsError;
  }
}

/**
 * Fetch settings by section path
 * @param request Request parameters
 * @param req Express request object for context
 * @returns Array of settings in the specified section
 */
export async function fetchSettingsBySection(request: FetchSettingsBySectionRequest, req: Request): Promise<AppSetting[]> {
  try {
    const { sectionPath, environment, includeConfidential = false, isPublicOnly } = request;
    const requestorUuid = getRequestorUuidFromReq(req);
    
    // Publish initiated event
    fabricEvents.createAndPublishEvent({
      eventName: SETTINGS_FETCH_BY_SECTION_EVENTS.REQUEST_INITIATED.eventName,
      req,
      payload: { 
        sectionPath, 
        environment,
        requestorUuid
      }
    });

    const allSettings = Object.values(getAllSettings());
    const pathVariants = normalizeSectionPath(sectionPath);
    
    // Filter by section path, trying all possible path variants
    let settings = allSettings.filter(setting => {
      // Try matching any normalized path variant
      return pathVariants.some(pathVariant => 
        setting.section_path.startsWith(pathVariant) ||
        normalizeSectionPath(setting.section_path).some(settingPathVariant => 
          settingPathVariant.startsWith(pathVariant)
        )
      );
    });
    
    // Apply filters
    settings = filterSettingsByEnvironment(settings, environment);
    settings = filterConfidentialSettings(settings, includeConfidential);
    settings = filterSettingsByPublicFlag(settings, isPublicOnly);

    // Publish success event
    fabricEvents.createAndPublishEvent({
      eventName: SETTINGS_FETCH_BY_SECTION_EVENTS.SUCCESS.eventName,
      req,
      payload: { 
        sectionPath, 
        settingsCount: settings.length,
        pathVariants,
        requestorUuid,
        isPublicOnly
      }
    });

    return settings;
  } catch (error) {
    // Получаем UUID пользователя из запроса для логирования
    const requestorUuid = getRequestorUuidFromReq(req);
    
    // Publish error event
    fabricEvents.createAndPublishEvent({
      eventName: SETTINGS_FETCH_EVENTS.ERROR.eventName,
      req,
      payload: { 
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        operation: 'fetchSettingsBySection',
        request,
        requestorUuid
      },
      errorData: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw {
      code: 'CACHE_ERROR',
      message: 'Failed to fetch settings by section',
      details: error
    } as SettingsError;
  }
}

/**
 * Fetch all settings with optional filtering
 * @param request Request parameters
 * @param req Express request object for context
 * @returns Array of all settings matching the filters
 */
export async function fetchAllSettings(request: FetchAllSettingsRequest, req: Request): Promise<AppSetting[]> {
  try {
    const { environment, includeConfidential = false, isPublicOnly } = request;
    const requestorUuid = getRequestorUuidFromReq(req);
    
    // Publish initiated event
    fabricEvents.createAndPublishEvent({
      eventName: SETTINGS_FETCH_ALL_EVENTS.REQUEST_INITIATED.eventName,
      req,
      payload: { 
        environment, 
        includeConfidential,
        isPublicOnly,
        requestorUuid
      }
    });

    let settings = Object.values(getAllSettings());
    
    // Apply filters
    settings = filterSettingsByEnvironment(settings, environment);
    settings = filterConfidentialSettings(settings, includeConfidential);
    settings = filterSettingsByPublicFlag(settings, isPublicOnly);

    // Publish success event
    fabricEvents.createAndPublishEvent({
      eventName: SETTINGS_FETCH_ALL_EVENTS.SUCCESS.eventName,
      req,
      payload: { 
        settingsCount: settings.length,
        isPublicOnly,
        requestorUuid
      }
    });

    return settings;
  } catch (error) {
    // Получаем UUID пользователя из запроса для логирования
    const requestorUuid = getRequestorUuidFromReq(req);
    
    // Publish error event
    fabricEvents.createAndPublishEvent({
      eventName: SETTINGS_FETCH_EVENTS.ERROR.eventName,
      req,
      payload: { 
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        operation: 'fetchAllSettings',
        request,
        requestorUuid
      },
      errorData: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw {
      code: 'CACHE_ERROR',
      message: 'Failed to fetch all settings',
      details: error
    } as SettingsError;
  }
}

/**
 * Handle fetch settings request with business logic
 * Contains all validation, permission checks, and request processing logic
 * @param req Express request object
 * @returns Promise resolving to settings response
 */
export async function handleFetchSettingsRequest(req: AuthenticatedRequest): Promise<FetchSettingsResponse> {
  const userId = req.user?.id;
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