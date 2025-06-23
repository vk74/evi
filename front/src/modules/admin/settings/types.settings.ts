/**
 * types.settings.ts
 * 
 * Type definitions for application settings.
 * Centralized location for all settings interfaces, types and enums.
 * Ensures consistent typing across all settings components and services.
 */

/**
 * Cache TTL in milliseconds (5 minutes)
 */
export const SETTINGS_CACHE_TTL = 5 * 60 * 1000;

/**
 * Environment type enum for settings
 */
export enum Environment {
  ALL = 'all',
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test'
}

/**
 * Interface for a single setting from app.app_settings
 * Simplified for frontend use, includes only required fields
 */
export interface AppSetting {
  section_path: string;      // Path to settings section (e.g. "security/passwords")
  setting_name: string;       // Unique setting identifier
  environment: string;        // Environment type
  value: any;                 // Setting value
  confidentiality: boolean;   // Whether this setting contains sensitive data
}

/**
 * Settings cache entry with timestamp for TTL management
 */
export interface SettingsCacheEntry {
  timestamp: number;          // When the settings were fetched
  data: AppSetting[];         // The actual settings data
}

/**
 * Request types for settings API calls
 */

/**
 * Base request for settings fetch operations
 */
export interface FetchSettingsBaseRequest {
  /**
   * Request type: byName, bySection, or all
   */
  type: 'byName' | 'bySection' | 'all';
  
  /**
   * Optional environment filter
   */
  environment?: string;

  /**
   * Whether to include confidential settings
   * Default: false
   */
  includeConfidential?: boolean;
}

/**
 * Request to fetch a single setting by name
 */
export interface FetchSettingByNameRequest extends FetchSettingsBaseRequest {
  /**
   * Type must be byName
   */
  type: 'byName';

  /**
   * Full setting path
   */
  sectionPath: string;

  /**
   * Setting name
   */
  settingName: string;
}

/**
 * Request to fetch settings by section path
 */
export interface FetchSettingsBySectionRequest extends FetchSettingsBaseRequest {
  /**
   * Type must be bySection
   */
  type: 'bySection';
  
  /**
   * Section path to filter settings by
   */
  sectionPath: string;
}

/**
 * Request to fetch all settings
 */
export interface FetchAllSettingsRequest extends FetchSettingsBaseRequest {
  /**
   * Type must be all
   */
  type: 'all';
}

/**
 * Union type for all fetch settings request types
 */
export type FetchSettingsRequest = 
  | FetchSettingByNameRequest
  | FetchSettingsBySectionRequest
  | FetchAllSettingsRequest;

/**
 * Response from the settings API
 */
export interface FetchSettingsResponse {
  /**
   * Whether the operation was successful
   */
  success: boolean;

  /**
   * Error message if operation failed
   */
  error?: string;

  /**
   * Settings returned by the operation
   */
  settings?: AppSetting[];

  /**
   * Single setting for byName fetch operations
   */
  setting?: AppSetting;
}

/**
 * Request for updating a setting value
 */
export interface UpdateSettingRequest {
  /**
   * Section path of the setting to update
   */
  sectionPath: string;
  
  /**
   * Name of the setting to update
   */
  settingName: string;
  
  /**
   * New value for the setting
   */
  value: any;
  
  /**
   * Optional environment to update setting for
   */
  environment?: string;
}

/**
 * Response for setting update operation
 */
export interface UpdateSettingResponse {
  /**
   * Whether the operation was successful
   */
  success: boolean;
  
  /**
   * Optional error message if operation failed
   */
  error?: string;
  
  /**
   * Updated setting if operation was successful
   */
  updatedSetting?: AppSetting;
}