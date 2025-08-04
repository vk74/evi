/**
 * service.validate.settings.ts
 * Service for validating setting values against their JSON schema definitions.
 */

import { AppSetting, SettingsError } from './types.settings';
import Ajv, { ErrorObject } from 'ajv';
import { createAndPublishEvent } from '../../../core/eventBus/fabric.events';
import { SETTINGS_VALIDATION_EVENTS } from './events.settings';

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
 * @param req - Express request object for event context
 * @returns Result object with validation status and potential errors
 */
export async function validateSettingValue(setting: AppSetting, value: any, req?: any): Promise<{ isValid: boolean; errors?: string[] }> {
  try {
    // If no validation schema provided, consider valid
    if (!setting.validation_schema) {
      await createAndPublishEvent({
        req,
        eventName: SETTINGS_VALIDATION_EVENTS.SKIP.eventName,
        payload: {
          sectionPath: setting.section_path,
          settingName: setting.setting_name
        }
      });
      return { isValid: true };
    }

    await createAndPublishEvent({
      req,
      eventName: SETTINGS_VALIDATION_EVENTS.START.eventName,
      payload: {
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

      await createAndPublishEvent({
        req,
        eventName: SETTINGS_VALIDATION_EVENTS.ERROR.eventName,
        payload: {
          sectionPath: setting.section_path,
          settingName: setting.setting_name,
          errors
        }
      });

      return { isValid: false, errors };
    }

    await createAndPublishEvent({
      req,
      eventName: SETTINGS_VALIDATION_EVENTS.SUCCESS.eventName,
      payload: {
        sectionPath: setting.section_path,
        settingName: setting.setting_name
      }
    });

    return { isValid: true };
  } catch (error) {
    // Handle validation errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    await createAndPublishEvent({
      req,
      eventName: SETTINGS_VALIDATION_EVENTS.FAILED.eventName,
      payload: {
        sectionPath: setting.section_path,
        settingName: setting.setting_name
      },
      errorData: errorMessage
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
 * @param req - Express request object for event context
 * @throws SettingsError if validation fails
 */
export async function validateOrThrow(setting: AppSetting, value: any, req?: any): Promise<void> {
  const result = await validateSettingValue(setting, value, req);
  
  if (!result.isValid) {
    const errorMessage = `Validation failed for ${setting.section_path}/${setting.setting_name}: ${result.errors?.join('; ')}`;
    throw createValidationError(errorMessage, result.errors);
  }
}