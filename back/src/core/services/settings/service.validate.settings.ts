/**
 * service.validate.settings.ts
 * Service for validating setting values against their JSON schema definitions.
 */

import { AppSetting, SettingsError } from './types.settings';
import Ajv, { ErrorObject } from 'ajv';
import { createSystemLogger, Logger } from '../../../core/logger/logger.index';
import { Events } from '../../../core/logger/codes';

// Create logger for validation service
const logger: Logger = createSystemLogger({
  module: 'SettingsValidationService',
  fileName: 'service.validate.settings.ts'
});

// Initialize JSON schema validator
const ajv = new Ajv({
  allErrors: true,
  verbose: true
});

/**
 * Validates a setting value against its schema
 * 
 * @param setting - The setting containing the schema to validate against
 * @param value - The value to validate
 * @returns Result object with validation status and potential errors
 */
export function validateSettingValue(setting: AppSetting, value: any): { isValid: boolean; errors?: string[] } {
  try {
    // If no validation schema provided, consider valid
    if (!setting.validation_schema) {
      logger.debug({
        code: Events.CORE.SETTINGS.VALIDATE.PROCESS.SKIP.code,
        message: 'No validation schema defined for setting, skipping validation',
        details: {
          sectionPath: setting.section_path,
          settingName: setting.setting_name
        }
      });
      return { isValid: true };
    }

    logger.debug({
      code: Events.CORE.SETTINGS.VALIDATE.PROCESS.START.code,
      message: 'Validating setting value against schema',
      details: {
        sectionPath: setting.section_path,
        settingName: setting.setting_name,
        schema: setting.validation_schema
      }
    });

    // Compile schema
    const validate = ajv.compile(setting.validation_schema);
    
    // Validate value against schema
    const isValid = validate(value);
    
    if (!isValid) {
      // Format validation errors
      const errors = (validate.errors || []).map((error: ErrorObject) => {
        // Try to get path information in a type-safe way
        // @ts-ignore - Handle both the original and newer ajv API
        const path = error.dataPath || (error as any).instancePath || '';
        return `${path} ${error.message || 'Invalid value'}`;
      });

      logger.warn({
        code: Events.CORE.SETTINGS.VALIDATE.PROCESS.ERROR.code,
        message: 'Setting value failed validation',
        details: {
          sectionPath: setting.section_path,
          settingName: setting.setting_name,
          errors
        }
      });

      return { isValid: false, errors };
    }

    logger.debug({
      code: Events.CORE.SETTINGS.VALIDATE.PROCESS.SUCCESS.code,
      message: 'Setting value passed validation',
      details: {
        sectionPath: setting.section_path,
        settingName: setting.setting_name
      }
    });

    return { isValid: true };
  } catch (error) {
    // Handle validation errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error({
      code: Events.CORE.SETTINGS.VALIDATE.PROCESS.ERROR.code,
      message: 'Error during setting validation',
      error,
      details: {
        sectionPath: setting.section_path,
        settingName: setting.setting_name,
        errorMessage
      }
    });
    
    return {
      isValid: false,
      errors: [errorMessage]
    };
  }
}

/**
 * Creates a validation error object
 * 
 * @param message - Error message
 * @param details - Optional error details
 * @returns SettingsError object
 */
export function createValidationError(message: string, details?: unknown): SettingsError {
  return {
    code: 'VALIDATION_ERROR',
    message,
    details
  };
}

/**
 * Validates a setting value and throws an error if invalid
 * 
 * @param setting - The setting containing the schema
 * @param value - The value to validate
 * @throws SettingsError if validation fails
 */
export function validateOrThrow(setting: AppSetting, value: any): void {
  const result = validateSettingValue(setting, value);
  
  if (!result.isValid) {
    const errorMessage = `Validation failed for ${setting.section_path}/${setting.setting_name}: ${result.errors?.join('; ')}`;
    throw createValidationError(errorMessage, result.errors);
  }
}