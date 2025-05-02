/**
 * service.fetch.settings.ts - version 1.0.01
 * Service for fetching settings from cache with filtering.
 * Now accepts request object for access to user context.
 */

import { Request } from 'express';
import { getAllSettings } from './cache.settings';
import { 
  AppSetting, 
  Environment,
  FetchSettingByNameRequest,
  FetchSettingsBySectionRequest,
  FetchAllSettingsRequest,
  SettingsError
} from './types.settings';
import { createSystemLgr, Lgr } from '../../../core/lgr/lgr.index';
import { Events } from '../../../core/lgr/codes';
import { getRequestorUuidFromReq } from '../../../core/helpers/get.requestor.uuid.from.req';

// Create lgr for settings service
const lgr: Lgr = createSystemLgr({
  module: 'SettingsService',
  fileName: 'service.fetch.settings.ts'
});

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
 * Normalize section path to support both PascalCase and snake_case formats
 * @param path Section path to normalize
 * @returns Array of normalized path variants for comparison
 */
function normalizeSectionPath(path: string): string[] {
  // Original path
  const variants = [path];
  
  // Convert PascalCase to snake_case: "UsersManagement.GroupsManagement" -> "users_management.groups_management"
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
  
  lgr.debug({
    code: 'SETTINGS:PATH:NORMALIZE',
    message: 'Normalized section path variants',
    details: { original: path, variants }
  });
  
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
    
    lgr.debug({
      code: Events.CORE.SETTINGS.GET.BY_NAME.INITIATED.code,
      message: 'Fetching setting by name',
      details: { 
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
      lgr.debug({
        code: Events.CORE.SETTINGS.GET.BY_NAME.NOT_FOUND.code,
        message: 'Setting not found',
        details: { 
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
      lgr.debug({
        code: Events.CORE.SETTINGS.GET.BY_NAME.NOT_FOUND.code,
        message: 'Setting found but environment does not match',
        details: { 
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
      lgr.debug({
        code: Events.CORE.SETTINGS.GET.BY_NAME.CONFIDENTIAL.code,
        message: 'Setting is confidential and includeConfidential is false',
        details: { 
          settingName,
          requestorUuid
        }
      });
      return null;
    }

    lgr.info({
      code: Events.CORE.SETTINGS.GET.BY_NAME.SUCCESS.code,
      message: 'Setting fetched successfully',
      details: { 
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
    
    lgr.error({
      code: Events.CORE.SETTINGS.GET.BY_NAME.ERROR.code,
      message: 'Error fetching setting by name',
      error,
      details: { 
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        request,
        requestorUuid
      }
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
    const { sectionPath, environment, includeConfidential = false } = request;
    const requestorUuid = getRequestorUuidFromReq(req);
    
    lgr.debug({
      code: Events.CORE.SETTINGS.GET.BY_SECTION.INITIATED.code,
      message: 'Fetching settings by section',
      details: { 
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

    lgr.info({
      code: Events.CORE.SETTINGS.GET.BY_SECTION.SUCCESS.code,
      message: 'Settings fetched by section successfully',
      details: { 
        sectionPath, 
        settingsCount: settings.length,
        pathVariants,
        requestorUuid
      }
    });

    return settings;
  } catch (error) {
    // Получаем UUID пользователя из запроса для логирования
    const requestorUuid = getRequestorUuidFromReq(req);
    
    lgr.error({
      code: Events.CORE.SETTINGS.GET.BY_SECTION.ERROR.code,
      message: 'Error fetching settings by section',
      error,
      details: { 
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        request,
        requestorUuid
      }
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
    const { environment, includeConfidential = false } = request;
    const requestorUuid = getRequestorUuidFromReq(req);
    
    lgr.debug({
      code: Events.CORE.SETTINGS.GET.ALL.INITIATED.code,
      message: 'Fetching all settings',
      details: { 
        environment, 
        includeConfidential,
        requestorUuid
      }
    });

    let settings = Object.values(getAllSettings());
    
    // Apply filters
    settings = filterSettingsByEnvironment(settings, environment);
    settings = filterConfidentialSettings(settings, includeConfidential);

    lgr.info({
      code: Events.CORE.SETTINGS.GET.ALL.SUCCESS.code,
      message: 'All settings fetched successfully',
      details: { 
        settingsCount: settings.length,
        requestorUuid
      }
    });

    return settings;
  } catch (error) {
    // Получаем UUID пользователя из запроса для логирования
    const requestorUuid = getRequestorUuidFromReq(req);
    
    lgr.error({
      code: Events.CORE.SETTINGS.GET.ALL.ERROR.code,
      message: 'Error fetching all settings',
      error,
      details: { 
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        request,
        requestorUuid
      }
    });
    
    throw {
      code: 'CACHE_ERROR',
      message: 'Failed to fetch all settings',
      details: error
    } as SettingsError;
  }
}