/**
 * service.load.validation.settings.ts - backend file
 * version: 1.0.0
 * Service for loading validation settings from database and converting them to ValidationRule objects
 * Uses the settings management system to fetch configuration from PostgreSQL
 */

import { Request } from 'express';
import { ValidationRule, FieldType } from './types.validation';
import { fetchSettingsBySection } from '../../modules/admin/settings/service.fetch.settings';
import { AppSetting } from '../../modules/admin/settings/types.settings';

// Cache TTL in milliseconds (30 minutes)
const CACHE_TTL = 30 * 60 * 1000;

// Cache for validation settings
interface ValidationSettingsCache {
  rules: Map<string, ValidationRule>;
  timestamp: number;
  ttl: number;
}

let validationCache: ValidationSettingsCache | null = null;

/**
 * Build regex pattern for standard fields based on allowSpecialChars setting
 * @param allowSpecialChars Whether to allow special characters
 * @returns Regular expression for standard text fields
 */
function buildStandardFieldRegex(allowSpecialChars: boolean): RegExp {
  if (allowSpecialChars) {
    // Allow letters, numbers, spaces, and common special characters
    return /^[a-zA-Zа-яА-ЯёЁ0-9\s\-_.,!?()@#$%&'*+=/<>[\]{}"`~;:|]+$/;
  } else {
    // Only letters, numbers, spaces, hyphens, and underscores
    return /^[a-zA-Zа-яА-ЯёЁ0-9\s\-_]+$/;
  }
}

/**
 * Get setting value from settings array by name
 * @param settings Array of app settings
 * @param settingName Name of the setting to get
 * @returns Setting value or null if not found
 */
function getSettingValue(settings: AppSetting[], settingName: string): any {
  const setting = settings.find(s => s.setting_name === settingName);
  return setting ? setting.value : null;
}

/**
 * Build ValidationRule for well-known userName field
 * @param settings Array of app settings
 * @returns ValidationRule for userName
 */
function buildUserNameRule(settings: AppSetting[]): ValidationRule {
  const minLength = getSettingValue(settings, 'wellKnownFields.userName.minLength') || 1;
  const maxLength = getSettingValue(settings, 'wellKnownFields.userName.maxLength') || 50;
  const allowNumbers = getSettingValue(settings, 'wellKnownFields.userName.allowNumbers') || true;
  const allowUsernameChars = getSettingValue(settings, 'wellKnownFields.userName.allowUsernameChars') || true;
  const latinOnly = getSettingValue(settings, 'wellKnownFields.userName.latinOnly') || false;

  // Build regex based on settings
  let regexPattern = '^[a-zA-Z';
  if (allowNumbers) regexPattern += '0-9';
  if (allowUsernameChars) regexPattern += '_';
  regexPattern += ']+$';

  const regex = new RegExp(regexPattern);

  return {
    fieldType: 'userName',
    regex,
    minLength,
    maxLength,
    required: true,
    messages: {
      required: 'Username is required',
      minLength: `Username must be at least ${minLength} characters long`,
      maxLength: `Username cannot exceed ${maxLength} characters`,
      invalidChars: 'Username contains invalid characters',
      noLetter: 'Username must contain at least one letter'
    }
  };
}

/**
 * Build ValidationRule for well-known groupName field
 * @param settings Array of app settings
 * @returns ValidationRule for groupName
 */
function buildGroupNameRule(settings: AppSetting[]): ValidationRule {
  const minLength = getSettingValue(settings, 'wellKnownFields.groupName.minLength') || 1;
  const maxLength = getSettingValue(settings, 'wellKnownFields.groupName.maxLength') || 50;
  const allowNumbers = getSettingValue(settings, 'wellKnownFields.groupName.allowNumbers') || true;
  const allowUsernameChars = getSettingValue(settings, 'wellKnownFields.groupName.allowUsernameChars') || true;
  const latinOnly = getSettingValue(settings, 'wellKnownFields.groupName.latinOnly') || false;

  // Build regex based on settings
  let regexPattern = '^[a-zA-Z';
  if (allowNumbers) regexPattern += '0-9';
  if (allowUsernameChars) regexPattern += '_-';
  regexPattern += ']+$';

  const regex = new RegExp(regexPattern);

  return {
    fieldType: 'groupName',
    regex,
    minLength,
    maxLength,
    required: true,
    messages: {
      required: 'Group name is required',
      minLength: `Group name must be at least ${minLength} characters long`,
      maxLength: `Group name cannot exceed ${maxLength} characters`,
      invalidChars: 'Group name contains invalid characters'
    }
  };
}

/**
 * Build ValidationRule for email field
 * @param settings Array of app settings
 * @returns ValidationRule for email
 */
function buildEmailRule(settings: AppSetting[]): ValidationRule {
  const regexPattern = getSettingValue(settings, 'wellKnownFields.email.regex') || 
    '^[a-zA-Z0-9.!#$%&\'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$';
  
  const regex = new RegExp(regexPattern);

  return {
    fieldType: 'email',
    regex,
    maxLength: 255,
    required: true,
    messages: {
      required: 'Email is required',
      invalid: 'Invalid email address format',
      maxLength: 'Email cannot exceed 255 characters'
    }
  };
}

/**
 * Build ValidationRule for telephoneNumber field
 * @param settings Array of app settings
 * @returns ValidationRule for telephoneNumber
 */
function buildTelephoneNumberRule(settings: AppSetting[]): ValidationRule {
  const maxLength = getSettingValue(settings, 'wellKnownFields.telephoneNumber.maxLength') || 15;
  const regexPattern = getSettingValue(settings, 'wellKnownFields.telephoneNumber.regex') || 
    '^\\+?[1-9]\\d{1,14}$';
  
  const regex = new RegExp(regexPattern);

  return {
    fieldType: 'telephoneNumber',
    regex,
    maxLength,
    required: false,
    messages: {
      invalid: 'Invalid telephone number format',
      maxLength: `Telephone number cannot exceed ${maxLength} characters`
    }
  };
}

/**
 * Build ValidationRule for standard field
 * @param settings Array of app settings
 * @param fieldType Type of the field
 * @param standardRegex Regex pattern for standard fields
 * @returns ValidationRule for standard field
 */
function buildStandardFieldRule(settings: AppSetting[], fieldType: FieldType, standardRegex: RegExp): ValidationRule {
  const maxLength = getSettingValue(settings, `standardFields.${fieldType}.maxLength`) || 100;

  return {
    fieldType,
    regex: standardRegex,
    maxLength,
    required: false,
    messages: {
      maxLength: `${fieldType} cannot exceed ${maxLength} characters`,
      invalidChars: `${fieldType} contains invalid characters`
    }
  };
}

/**
 * Load validation settings from database and convert to ValidationRule objects
 * @param req Express request object for context
 * @returns Map of field types to ValidationRule objects
 */
export async function loadValidationSettings(req: Request): Promise<Map<string, ValidationRule>> {
  try {
    console.log('Loading validation settings from database...');
    
    // Fetch all validation settings from database
    const settings = await fetchSettingsBySection({
      sectionPath: 'Application.System.DataValidation',
      includeConfidential: false
    }, req);

    if (!settings || settings.length === 0) {
      throw new Error('No validation settings found in database');
    }

    console.log(`Loaded ${settings.length} validation settings from database`);

    const rules = new Map<string, ValidationRule>();

    // Build well-known field rules
    rules.set('userName', buildUserNameRule(settings));
    rules.set('groupName', buildGroupNameRule(settings));
    rules.set('email', buildEmailRule(settings));
    rules.set('telephoneNumber', buildTelephoneNumberRule(settings));

    // Build standard field rules
    const allowSpecialChars = getSettingValue(settings, 'standardFields.allowSpecialChars') || true;
    const standardRegex = buildStandardFieldRegex(allowSpecialChars);

    rules.set('text-micro', buildStandardFieldRule(settings, 'text-micro', standardRegex));
    rules.set('text-mini', buildStandardFieldRule(settings, 'text-mini', standardRegex));
    rules.set('text-short', buildStandardFieldRule(settings, 'text-short', standardRegex));
    rules.set('text-medium', buildStandardFieldRule(settings, 'text-medium', standardRegex));
    rules.set('text-long', buildStandardFieldRule(settings, 'text-long', standardRegex));
    rules.set('text-extralong', buildStandardFieldRule(settings, 'text-extralong', standardRegex));

    console.log(`Built ${rules.size} validation rules from settings`);
    return rules;

  } catch (error) {
    console.error('Failed to load validation settings:', error);
    throw new Error(`Failed to load validation settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if validation cache is expired
 * @returns True if cache is expired or doesn't exist
 */
function isCacheExpired(): boolean {
  if (!validationCache) return true;
  return Date.now() - validationCache.timestamp > validationCache.ttl;
}

/**
 * Get validation rules from cache or load from database
 * @param req Express request object for context
 * @returns Map of field types to ValidationRule objects
 */
export async function getValidationRules(req: Request): Promise<Map<string, ValidationRule>> {
  // Check if cache is valid
  if (!isCacheExpired()) {
    console.log('Using cached validation rules');
    return validationCache!.rules;
  }

  // Load fresh settings from database
  console.log('Cache expired or not found, loading fresh validation rules...');
  const rules = await loadValidationSettings(req);

  // Update cache
  validationCache = {
    rules,
    timestamp: Date.now(),
    ttl: CACHE_TTL
  };

  console.log('Validation rules cache updated');
  return rules;
}

/**
 * Clear validation cache (for testing or manual refresh)
 */
export function clearValidationCache(): void {
  validationCache = null;
  console.log('Validation cache cleared');
}

/**
 * Get validation rule for specific field type
 * @param fieldType Type of field to get rule for
 * @param req Express request object for context
 * @returns ValidationRule or null if not found
 */
export async function getValidationRule(fieldType: string, req: Request): Promise<ValidationRule | null> {
  const rules = await getValidationRules(req);
  return rules.get(fieldType) || null;
}
