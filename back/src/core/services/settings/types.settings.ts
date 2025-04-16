/**
 * types.settings.ts
 * Type definitions for settings management based on app.app_settings table structure.
 */

/**
 * Environment type enum matching app.environment_type in database
 */
export enum Environment {
  ALL = 'all',
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test'
}

/**
 * Interface representing a single setting from app.app_settings
 */
export interface AppSetting {
  section_path: string;          // Path to settings section (e.g. "security/passwords")
  setting_name: string;          // Unique setting identifier
  environment: Environment;      // Environment type
  value: any;                   // Setting value stored as JSONB
  validation_schema?: any;      // Optional JSON Schema for validation
  default_value?: any;         // Optional default value
  confidentiality: boolean;    // Whether this setting contains sensitive data
  description?: string;        // Optional setting description
  updated_at: Date;           // Last update timestamp
}

/**
 * Cache structure for settings
 * Key is combination of section_path and setting_name
 */
export interface SettingsCache {
  [key: string]: AppSetting;
}

/**
 * Error types for settings operations
 */
export interface SettingsError {
  code: 'DB_ERROR' | 'CACHE_ERROR' | 'VALIDATION_ERROR';
  message: string;
  details?: unknown;
}

/**
 * Request types for settings fetch operations
 */

/**
 * Base request for settings fetch operations
 */
export interface FetchSettingsBaseRequest {
  /**
   * Optional environment filter
   */
  environment?: Environment;
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
   * Section path to filter settings by
   */
  sectionPath: string;
}

/**
 * Request to fetch all settings
 */
export interface FetchAllSettingsRequest extends FetchSettingsBaseRequest {
  // No additional properties needed
}

/**
 * Union type for all fetch settings request types
 */
export type FetchSettingsRequest = 
  | FetchSettingByNameRequest
  | FetchSettingsBySectionRequest
  | FetchAllSettingsRequest;

/**
 * Response types for settings fetch operations
 */

/**
 * Response for settings fetch operations
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
   * Single setting for single fetch operations
   */
  setting?: AppSetting;
}