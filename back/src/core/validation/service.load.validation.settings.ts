/**
 * service.load.validation.settings.ts - backend file
 * version: 1.2.0
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
// Standard fields logic removed: we no longer build regex for standard text buckets

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
 * Safely coalesce value with default, respecting explicit false/0
 */
function coalesce<T>(val: T | null | undefined, fallback: T): T {
  return (val === null || val === undefined) ? fallback : val;
}

/**
 * Unwrap string values that might be JSON-stringified
 */
function unwrapString(raw: any): string {
  if (raw === null || raw === undefined) return '';
  const str = String(raw);
  // Attempt JSON.parse when value looks like a JSON string
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    try {
      const parsed = JSON.parse(str as unknown as string);
      return typeof parsed === 'string' ? parsed : str;
    } catch {
      return str;
    }
  }
  return str;
}

/**
 * Build ValidationRule for well-known userName field
 * @param settings Array of app settings
 * @returns ValidationRule for userName
 */
function buildUserNameRule(settings: AppSetting[]): ValidationRule {
  const minLength = Number(coalesce(getSettingValue(settings, 'wellKnownFields.userName.minLength'), 1));
  const maxLength = Number(coalesce(getSettingValue(settings, 'wellKnownFields.userName.maxLength'), 50));
  const allowNumbers = Boolean(coalesce(getSettingValue(settings, 'wellKnownFields.userName.allowNumbers'), true));
  const allowUsernameChars = Boolean(coalesce(getSettingValue(settings, 'wellKnownFields.userName.allowUsernameChars'), true));
  const latinOnly = Boolean(coalesce(getSettingValue(settings, 'wellKnownFields.userName.latinOnly'), false));

  // Build regex based on settings
  // latinOnly=true -> ASCII letters only; latinOnly=false -> any Unicode letters
  const letterClass = latinOnly ? 'A-Za-z' : '\\p{L}';
  let cls = `[${letterClass}`;
  if (allowNumbers) cls += '0-9';
  if (allowUsernameChars) cls += '._-';
  cls += ']';
  const regexPattern = `^${cls}+$`;

  const regex = new RegExp(regexPattern, latinOnly ? undefined : 'u');

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
  const minLength = Number(coalesce(getSettingValue(settings, 'wellKnownFields.groupName.minLength'), 1));
  const maxLength = Number(coalesce(getSettingValue(settings, 'wellKnownFields.groupName.maxLength'), 50));
  const allowNumbers = Boolean(coalesce(getSettingValue(settings, 'wellKnownFields.groupName.allowNumbers'), true));
  const allowUsernameChars = Boolean(coalesce(getSettingValue(settings, 'wellKnownFields.groupName.allowUsernameChars'), true));
  const latinOnly = Boolean(coalesce(getSettingValue(settings, 'wellKnownFields.groupName.latinOnly'), false));

  // Build regex based on settings
  const letterClass = latinOnly ? 'A-Za-z' : '\\p{L}';
  let cls = `[${letterClass}`;
  if (allowNumbers) cls += '0-9';
  if (allowUsernameChars) cls += '_-';
  cls += ']';
  const regexPattern = `^${cls}+$`;

  const regex = new RegExp(regexPattern, latinOnly ? undefined : 'u');

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
  const raw = getSettingValue(settings, 'wellKnownFields.email.regex');
  const patternStr = unwrapString(raw) || '^[^\s@]+@[^\s@]+\.[^\s@]+$';
  let regex: RegExp;
  try {
    regex = new RegExp(patternStr);
  } catch {
    regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  }

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
  const maskRaw = getSettingValue(settings, 'wellKnownFields.telephoneNumber.mask');
  const mask = unwrapString(maskRaw) || '+# ### ###-####';
  
  // Generate regex from mask
  let regexPattern = mask
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/#/g, '\\d');
  
  regexPattern = '^' + regexPattern + '$';
  
  const regex = new RegExp(regexPattern);

  return {
    fieldType: 'telephoneNumber',
    regex,
    required: false,
    messages: {
      invalid: 'Invalid telephone number format'
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
// Standard field rule builder removed

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

    // Standard field rules removed: rely on DB constraints and guards

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
