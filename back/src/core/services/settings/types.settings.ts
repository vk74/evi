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
  sections_path: string;          // Path to settings section (e.g. "security/passwords")
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
 * Key is combination of sections_path and setting_name
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