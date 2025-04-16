/**
 * service.fetch.settings.ts
 * Service for fetching settings from cache with filtering.
 */

import { getAllSettings } from './cache.settings';
import { 
  AppSetting, 
  Environment,
  FetchSettingByNameRequest,
  FetchSettingsBySectionRequest,
  FetchAllSettingsRequest,
  SettingsError
} from './types.settings';
import { createSystemLogger, Logger } from '../../../core/logger/logger.index';
import { Events } from '../../../core/logger/codes';

// Create logger for settings service
const logger: Logger = createSystemLogger({
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
 * Fetch a single setting by section path and name
 * @param request Request parameters
 * @returns The requested setting or null if not found
 */
export async function fetchSettingByName(request: FetchSettingByNameRequest): Promise<AppSetting | null> {
  try {
    const { sectionPath, settingName, environment, includeConfidential = false } = request;
    
    logger.debug({
      code: Events.CORE.SETTINGS.GET.BY_NAME.INITIATED.code,
      message: 'Fetching setting by name',
      details: { sectionPath, settingName, environment }
    });

    const allSettings = Object.values(getAllSettings());
    
    // Find the specific setting
    const setting = allSettings.find(s => 
      s.section_path === sectionPath && 
      s.setting_name === settingName
    );

    if (!setting) {
      logger.debug({
        code: Events.CORE.SETTINGS.GET.BY_NAME.NOT_FOUND.code,
        message: 'Setting not found',
        details: { sectionPath, settingName }
      });
      return null;
    }

    // Check environment
    if (environment && 
        environment !== Environment.ALL && 
        setting.environment !== Environment.ALL && 
        setting.environment !== environment) {
      logger.debug({
        code: Events.CORE.SETTINGS.GET.BY_NAME.NOT_FOUND.code,
        message: 'Setting found but environment does not match',
        details: { settingName, requestedEnv: environment, settingEnv: setting.environment }
      });
      return null;
    }

    // Check confidentiality
    if (!includeConfidential && setting.confidentiality) {
      logger.debug({
        code: Events.CORE.SETTINGS.GET.BY_NAME.CONFIDENTIAL.code,
        message: 'Setting is confidential and includeConfidential is false',
        details: { settingName }
      });
      return null;
    }

    logger.info({
      code: Events.CORE.SETTINGS.GET.BY_NAME.SUCCESS.code,
      message: 'Setting fetched successfully',
      details: { settingName, sectionPath }
    });

    return setting;
  } catch (error) {
    logger.error({
      code: Events.CORE.SETTINGS.GET.BY_NAME.ERROR.code,
      message: 'Error fetching setting by name',
      error,
      details: { 
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        request 
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
 * @returns Array of settings in the specified section
 */
export async function fetchSettingsBySection(request: FetchSettingsBySectionRequest): Promise<AppSetting[]> {
  try {
    const { sectionPath, environment, includeConfidential = false } = request;
    
    logger.debug({
      code: Events.CORE.SETTINGS.GET.BY_SECTION.INITIATED.code,
      message: 'Fetching settings by section',
      details: { sectionPath, environment }
    });

    const allSettings = Object.values(getAllSettings());
    
    // Filter by section path
    let settings = allSettings.filter(setting => 
      setting.section_path.startsWith(sectionPath)
    );
    
    // Apply filters
    settings = filterSettingsByEnvironment(settings, environment);
    settings = filterConfidentialSettings(settings, includeConfidential);

    logger.info({
      code: Events.CORE.SETTINGS.GET.BY_SECTION.SUCCESS.code,
      message: 'Settings fetched by section successfully',
      details: { 
        sectionPath, 
        settingsCount: settings.length 
      }
    });

    return settings;
  } catch (error) {
    logger.error({
      code: Events.CORE.SETTINGS.GET.BY_SECTION.ERROR.code,
      message: 'Error fetching settings by section',
      error,
      details: { 
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        request 
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
 * @returns Array of all settings matching the filters
 */
export async function fetchAllSettings(request: FetchAllSettingsRequest): Promise<AppSetting[]> {
  try {
    const { environment, includeConfidential = false } = request;
    
    logger.debug({
      code: Events.CORE.SETTINGS.GET.ALL.INITIATED.code,
      message: 'Fetching all settings',
      details: { environment, includeConfidential }
    });

    let settings = Object.values(getAllSettings());
    
    // Apply filters
    settings = filterSettingsByEnvironment(settings, environment);
    settings = filterConfidentialSettings(settings, includeConfidential);

    logger.info({
      code: Events.CORE.SETTINGS.GET.ALL.SUCCESS.code,
      message: 'All settings fetched successfully',
      details: { settingsCount: settings.length }
    });

    return settings;
  } catch (error) {
    logger.error({
      code: Events.CORE.SETTINGS.GET.ALL.ERROR.code,
      message: 'Error fetching all settings',
      error,
      details: { 
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        request 
      }
    });
    
    throw {
      code: 'CACHE_ERROR',
      message: 'Failed to fetch all settings',
      details: error
    } as SettingsError;
  }
}