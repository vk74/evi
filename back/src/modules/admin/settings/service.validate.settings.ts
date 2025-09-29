/**
 * service.validate.settings.ts - backend file
 * version: 1.1.0
 * Service for validating setting values against their JSON schema definitions.
 * Handles both standard JSON schema validation and custom validation for special field types.
 * Provides centralized validation logic for all application settings with event logging.
 */

import { AppSetting, SettingsError } from './types.settings';
import Ajv, { ErrorObject } from 'ajv';
import { createAndPublishEvent } from '../../../core/eventBus/fabric.events';
import { SETTINGS_VALIDATION_EVENTS } from './events.settings';
import { validateRegexString } from '../../../core/helpers/validate.regex';

/**
 * Validation result interface for custom validation functions
 */
interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}

/**
 * Initialize JSON schema validator with comprehensive error reporting
 */
const ajv = new Ajv({
  allErrors: true,
  verbose: true
});

/**
 * Main validation function that handles different types of setting validation
 * Routes to appropriate validation method based on setting type (standard, regex, phone mask)
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

    // Special handling for regex fields - use custom validation instead of AJV
    if (isRegexField(setting)) {
      return await validateRegexField(setting, value, req);
    }

    // Special handling for phone mask fields - use custom validation
    if (isPhoneMaskField(setting)) {
      return await validatePhoneMaskField(setting, value, req);
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
 * Creates a standardized validation error object for consistent error handling
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
 * Used by service.update.settings.ts to enforce validation before database updates
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

/**
 * Checks if a setting is a regex field that needs special validation
 * Identifies regex fields by name pattern or schema format
 * 
 * @param setting - The setting to check
 * @returns True if this is a regex field
 */
function isRegexField(setting: AppSetting): boolean {
  // Check by setting name (covers email.regex, telephoneNumber.regex, etc.)
  return setting.setting_name.includes('regex') || 
         // Check by validation schema format
         (setting.validation_schema && 
          typeof setting.validation_schema === 'object' && 
          'format' in setting.validation_schema && 
          setting.validation_schema.format === 'regex');
}

/**
 * Checks if a setting is a phone mask field that needs custom validation
 * Identifies phone mask fields by name pattern
 * 
 * @param setting - The setting to check
 * @returns True if this is a phone mask field
 */
function isPhoneMaskField(setting: AppSetting): boolean {
  return setting.setting_name.includes('telephoneNumber.mask') || 
         setting.setting_name.includes('phone.mask');
}

/**
 * Validates a regex field using custom validation instead of AJV
 * Uses validateRegexString helper for comprehensive regex validation
 * 
 * @param setting - The setting containing the regex field
 * @param value - The regex string to validate
 * @param req - Express request object for event context
 * @returns Result object with validation status and potential errors
 */
async function validateRegexField(setting: AppSetting, value: any, req?: any): Promise<{ isValid: boolean; errors?: string[] }> {
  await createAndPublishEvent({
    req,
    eventName: SETTINGS_VALIDATION_EVENTS.START.eventName,
    payload: {
      sectionPath: setting.section_path,
      settingName: setting.setting_name,
      schema: 'custom-regex-validation'
    }
  });

  // Validate using custom regex helper
  const validation = validateRegexString(String(value));
  
  if (!validation.isValid) {
    await createAndPublishEvent({
      req,
      eventName: SETTINGS_VALIDATION_EVENTS.ERROR.eventName,
      payload: {
        sectionPath: setting.section_path,
        settingName: setting.setting_name,
        errors: [validation.error || 'Invalid regex']
      }
    });

    return { 
      isValid: false, 
      errors: [validation.error || 'Invalid regex'] 
    };
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
}

/**
 * Validates a phone mask field using custom validation
 * Handles JSON string parsing and uses validatePhoneMask helper for validation
 * 
 * @param setting - The setting containing the phone mask field
 * @param value - The phone mask string to validate
 * @param req - Express request object for event context
 * @returns Result object with validation status and potential errors
 */
async function validatePhoneMaskField(setting: AppSetting, value: any, req: Request): Promise<ValidationResult> {
  try {
    await createAndPublishEvent({
      req,
      eventName: SETTINGS_VALIDATION_EVENTS.START.eventName,
      payload: {
        sectionPath: setting.section_path,
        settingName: setting.setting_name,
        customValidation: 'phoneMask'
      }
    });

    // Import phone mask validation helper
    const { validatePhoneMask } = await import('@/core/helpers/validate.phone.mask');
    
    // Parse JSON string if needed (same as regex validation)
    let phoneMaskValue = String(value);
    try {
      // Try to parse as JSON first (in case it's a JSON string)
      const parsed = JSON.parse(phoneMaskValue);
      if (typeof parsed === 'string') {
        phoneMaskValue = parsed;
      }
    } catch (error) {
      // If not JSON, use as is
    }
    
    // Validate phone mask
    const validation = validatePhoneMask(phoneMaskValue);
    
    if (!validation.isValid) {
      await createAndPublishEvent({
        req,
        eventName: SETTINGS_VALIDATION_EVENTS.ERROR.eventName,
        payload: {
          sectionPath: setting.section_path,
          settingName: setting.setting_name,
          errors: [validation.error || 'Invalid phone mask']
        }
      });

      return { isValid: false, errors: [validation.error || 'Invalid phone mask'] };
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
      errors: [`Phone mask validation failed: ${errorMessage}`]
    };
  }
}